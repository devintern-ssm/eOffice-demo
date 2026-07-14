import { prisma } from '../../prisma.js';
import { ApiError } from '../../utils/http.js';
import type { AuthUser } from '../../middleware/auth.js';
import { getFileDetail } from '../files/files.service.js';
import { notifyData } from '../../services/notify.js';
import { STEP_ROLES } from '../../utils/domain.js';

export interface Signer { userId: string; roleLabel?: string }

export interface AddNoteInput {
  content: string;
  isDraft?: boolean;
  isSuoMoto?: boolean;
  references?: { correspondence?: string[]; notes?: string[] };
  signers?: Signer[];
}

function roleLabelFor(requested: string | undefined, userRole: string): string {
  if (requested && requested.trim()) return requested.trim();
  if ((STEP_ROLES as readonly string[]).includes(userRole)) return userRole;
  return 'Signatory';
}

/** Notes are strictly sequential: only one note may be in flight (IN_REVIEW or RETURNED) at a time. */
async function assertNoNoteInFlight(fileId: string, exceptNoteId?: string) {
  const inFlight = await prisma.note.findFirst({
    where: { fileId, status: { in: ['IN_REVIEW', 'RETURNED'] }, ...(exceptNoteId ? { id: { not: exceptNoteId } } : {}) },
  });
  if (inFlight) throw ApiError.badRequest(`Note ${inFlight.noteNumber} is still in progress — finish it before starting another note`);
}

function buildRefs(references?: AddNoteInput['references']) {
  return [
    ...(references?.correspondence ?? []).map((r) => ({ targetType: 'CORRESPONDENCE', targetRef: r })),
    ...(references?.notes ?? []).map((r) => ({ targetType: 'NOTE', targetRef: r })),
  ];
}

/**
 * Open the next note in a binder. Any officer (non-admin) may raise a note on an idle binder —
 * the actor becomes the note's MAKER. Saved as a DRAFT; if `isDraft` is false it is immediately
 * put up for signature via the given signer chain (which pulls the file into that note's flow).
 */
export async function addNote(fileId: string, input: AddNoteInput, user: AuthUser) {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) throw ApiError.notFound('File not found');
  if (file.status === 'CLOSED') throw ApiError.badRequest('File is closed');
  if (user.role === 'ADMIN') throw ApiError.forbidden('Admins do not raise notes');
  // Sequential rule: a binder can hold only one note in flight at a time.
  await assertNoNoteInFlight(fileId);

  const last = await prisma.note.findFirst({ where: { fileId }, orderBy: { noteNumber: 'desc' } });
  const noteNumber = (last?.noteNumber ?? 0) + 1;

  const note = await prisma.$transaction(async (tx) => {
    const n = await tx.note.create({
      data: {
        fileId,
        noteNumber,
        content: input.content,
        authorId: user.id,
        authorName: user.name,
        authorRole: user.role,
        status: 'DRAFT',
        isSuoMoto: input.isSuoMoto ?? false,
        references: { create: buildRefs(input.references) },
      },
    });
    await tx.movement.create({
      data: { fileId, type: 'OPEN_NOTE', actorId: user.id, actorName: user.name, noteNumber, remarks: `Note ${noteNumber} started${input.isDraft ? ' (draft)' : ''}` },
    });
    await tx.file.update({ where: { id: fileId }, data: { lastUsedAt: new Date() } });
    return n;
  });

  if (!input.isDraft) {
    return submitNote(fileId, note.id, { signers: input.signers ?? [] }, user);
  }
  return getFileDetail(fileId, user);
}

/** Edit a DRAFT or RETURNED note's content/references — the note's maker only. */
export async function updateNote(
  fileId: string,
  noteId: string,
  input: { content?: string; references?: AddNoteInput['references'] },
  user: AuthUser,
) {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) throw ApiError.notFound('File not found');
  if (file.status === 'CLOSED') throw ApiError.badRequest('File is closed');
  const note = await prisma.note.findFirst({ where: { id: noteId, fileId } });
  if (!note) throw ApiError.notFound('Note not found');
  if (note.authorId !== user.id && user.role !== 'ADMIN') throw ApiError.forbidden('Only the note maker can edit this note');
  if (!['DRAFT', 'RETURNED'].includes(note.status)) throw ApiError.badRequest('Only a draft or a returned note can be edited');
  if (input.content != null && !input.content.trim()) throw ApiError.badRequest('Note content is required');

  await prisma.$transaction(async (tx) => {
    await tx.note.update({
      where: { id: noteId },
      data: { ...(input.content != null ? { content: input.content } : {}) },
    });
    if (input.references) {
      await tx.noteReference.deleteMany({ where: { noteId } });
      const refs = buildRefs(input.references);
      if (refs.length) await tx.noteReference.createMany({ data: refs.map((r) => ({ ...r, noteId })) });
    }
    await tx.movement.create({
      data: { fileId, type: 'NOTE_ADDED', actorId: user.id, actorName: user.name, noteNumber: note.noteNumber, remarks: `Note ${note.noteNumber} edited` },
    });
    await tx.file.update({ where: { id: fileId }, data: { lastUsedAt: new Date() } });
  });

  return getFileDetail(fileId, user);
}

/**
 * Put a DRAFT or RETURNED note up for signature: build its signer chain and move the file to
 * the first signer. With no signers, the maker records (finalizes) the note themselves.
 */
export async function submitNote(fileId: string, noteId: string, input: { signers?: Signer[]; remarks?: string }, user: AuthUser) {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) throw ApiError.notFound('File not found');
  if (file.status === 'CLOSED') throw ApiError.badRequest('File is closed');
  const note = await prisma.note.findFirst({ where: { id: noteId, fileId } });
  if (!note) throw ApiError.notFound('Note not found');
  if (note.authorId !== user.id && user.role !== 'ADMIN') throw ApiError.forbidden('Only the note maker can put this note up for signature');
  if (!['DRAFT', 'RETURNED'].includes(note.status)) throw ApiError.badRequest('Only a draft or a returned note can be submitted');
  await assertNoNoteInFlight(fileId, noteId);

  // Validate signer users before opening the transaction.
  const signerUsers: { u: { id: string; name: string; role: string }; roleLabel: string }[] = [];
  for (const s of input.signers ?? []) {
    const u = await prisma.user.findUnique({ where: { id: s.userId } });
    if (!u) throw ApiError.badRequest(`Signer not found: ${s.userId}`);
    signerUsers.push({ u, roleLabel: roleLabelFor(s.roleLabel, u.role) });
  }

  await prisma.$transaction(async (tx) => {
    // Re-check the sequential invariant INSIDE the transaction (closes the check-then-act race
    // where two drafts could both reach IN_REVIEW). SQLite serializes writers; on Postgres this
    // narrows the window to the transaction boundary.
    const other = await tx.note.findFirst({ where: { fileId, status: { in: ['IN_REVIEW', 'RETURNED'] }, id: { not: noteId } } });
    if (other) throw ApiError.badRequest(`Note ${other.noteNumber} is already in progress`);

    // Keep noting order chronological: a stale draft submitted after newer notes were finalized
    // must NOT insert before them (that would shift their supposedly-immutable page spans).
    const agg = await tx.note.aggregate({ where: { fileId }, _max: { noteNumber: true } });
    const maxNumber = agg._max.noteNumber ?? note.noteNumber;
    let noteNumber = note.noteNumber;
    if (maxNumber > note.noteNumber) {
      noteNumber = maxNumber + 1;
      await tx.note.update({ where: { id: noteId }, data: { noteNumber } });
    }

    await tx.noteStep.deleteMany({ where: { noteId } }); // rebuild a fresh chain (also on resubmit)
    let order = 0;
    for (const { u, roleLabel } of signerUsers) {
      order += 1;
      await tx.noteStep.create({
        data: { noteId, fileId, stepOrder: order, signerId: u.id, signerName: u.name, roleLabel, status: 'PENDING' },
      });
    }

    if (order === 0) {
      // Self-recorded note (informational) — maker finalizes it immediately.
      await tx.note.update({ where: { id: noteId }, data: { status: 'FINALIZED', submittedAt: new Date(), finalizedAt: new Date() } });
      await tx.file.update({ where: { id: fileId }, data: { currentHolderId: note.authorId, lastUsedAt: new Date() } });
      await tx.movement.create({
        data: { fileId, type: 'FINALIZE', actorId: user.id, actorName: user.name, noteNumber, remarks: `Note ${noteNumber} recorded (no signatories)` },
      });
    } else {
      const first = await tx.noteStep.findFirst({ where: { noteId }, orderBy: { stepOrder: 'asc' } });
      await tx.note.update({ where: { id: noteId }, data: { status: 'IN_REVIEW', submittedAt: new Date() } });
      await tx.file.update({ where: { id: fileId }, data: { currentHolderId: first!.signerId, lastUsedAt: new Date() } });
      await tx.movement.create({
        data: { fileId, type: 'SUBMIT_NOTE', actorId: user.id, actorName: user.name, toUserId: first!.signerId, toName: first!.signerName, noteNumber, remarks: input.remarks || `Note ${noteNumber} put up for signature` },
      });
      if (first!.signerId !== user.id) {
        await tx.notification.create(notifyData(first!.signerId, 'SIGN', `Note ${noteNumber} awaits your signature: ${file.subject}`, fileId));
      }
    }
  });

  return getFileDetail(fileId, user);
}
