import { prisma } from '../../prisma.js';
import { ApiError } from '../../utils/http.js';
import type { AuthUser } from '../../middleware/auth.js';
import { storage } from '../../services/storage.js';
import { countPdfPages } from '../../services/pdf.js';
import { getFileDetail } from '../files/files.service.js';
import { notifyData } from '../../services/notify.js';

/**
 * Sign the in-flight note's active step OFFLINE via an uploaded scanned, manually-signed copy.
 * The scan is filed as correspondence (so it joins the continuous page numbering) and the step
 * is stamped as signed. Advances to the next signer, or finalizes the note.
 */
export async function uploadMdApproval(fileId: string, input: { remarks?: string }, fileBuffer: Buffer | undefined, user: AuthUser) {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) throw ApiError.notFound('File not found');
  if (!fileBuffer) throw ApiError.badRequest('A scanned PDF approval is required');
  const note = await prisma.note.findFirst({
    where: { fileId, status: 'IN_REVIEW' },
    include: { steps: { orderBy: { stepOrder: 'asc' } } },
  });
  if (!note) throw ApiError.badRequest('No note is currently under signature on this file');
  const current = note.steps.find((s) => s.status === 'PENDING');
  if (!current) throw ApiError.badRequest('No pending signatory step to record');
  // Only the current holder (== the active signer) may record their own offline signature — this
  // matches signNote's rule and prevents the originator/anyone else forging a signer's approval.
  if (file.currentHolderId !== user.id) {
    throw ApiError.forbidden('Only the current signer can record an offline signature');
  }

  const storageKey = await storage.save(fileBuffer, 'pdf');
  const pageCount = (await countPdfPages(fileBuffer)) ?? 1;

  await prisma.$transaction(async (tx) => {
    const count = await tx.correspondence.count({ where: { fileId } });
    await tx.correspondence.create({
      data: { fileId, number: `C/${count + 1}`, seq: count, type: 'Signed approval (scanned)', title: input.remarks || `Offline signature — Note ${note.noteNumber}`, storageKey, mime: 'application/pdf', pageCount, originalName: 'signed-approval.pdf', uploadedById: user.id, uploadedByName: user.name },
    });
    await tx.noteStep.update({
      where: { id: current.id },
      data: { status: 'SIGNED', remarks: input.remarks || 'Signed offline (scanned copy)', dept: user.section, signatureName: `${current.signerName} (offline)`, actedAt: new Date() },
    });

    const next = note.steps.find((s) => s.stepOrder > current.stepOrder && s.status === 'PENDING');
    if (next) {
      await tx.file.update({ where: { id: fileId }, data: { currentHolderId: next.signerId, lastUsedAt: new Date() } });
      if (next.signerId !== user.id) await tx.notification.create(notifyData(next.signerId, 'SIGN', `Note ${note.noteNumber} awaits your signature: ${file.subject}`, fileId));
      await tx.movement.create({ data: { fileId, type: 'SIGN', actorId: user.id, actorName: user.name, toUserId: next.signerId, toName: next.signerName, dept: user.section, noteNumber: note.noteNumber, remarks: `Offline signature filed for ${current.signerName}` } });
    } else {
      await tx.note.update({ where: { id: note.id }, data: { status: 'FINALIZED', finalizedAt: new Date() } });
      await tx.file.update({ where: { id: fileId }, data: { currentHolderId: note.authorId, lastUsedAt: new Date() } });
      if (note.authorId !== user.id) await tx.notification.create(notifyData(note.authorId, 'FINALIZE', `Note ${note.noteNumber} finalized and returned to you: ${file.subject}`, fileId));
      await tx.movement.create({ data: { fileId, type: 'FINALIZE', actorId: user.id, actorName: user.name, toUserId: note.authorId, toName: note.authorName, dept: user.section, noteNumber: note.noteNumber, remarks: `Note ${note.noteNumber} finalized (offline signature)` } });
    }
  });

  return getFileDetail(fileId, user);
}

/**
 * Pre-assign a specific approver to a note (or a paragraph within it) — an optional annotation
 * on top of the signer chain. Recorded as a PENDING ParagraphApproval.
 */
export async function assignParagraphApprover(
  fileId: string,
  noteId: string,
  input: { paragraphMark?: string; approverId: string; role?: 'CHECKER' | 'APPROVER' },
  user: AuthUser,
) {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) throw ApiError.notFound('File not found');
  if (file.status === 'CLOSED') throw ApiError.badRequest('File is closed');
  if (!(file.currentHolderId === user.id || file.createdById === user.id || user.role === 'ADMIN')) {
    throw ApiError.forbidden('Only the current holder can assign a note reviewer');
  }
  const note = await prisma.note.findFirst({ where: { id: noteId, fileId } });
  if (!note) throw ApiError.notFound('Note not found');
  const approver = await prisma.user.findUnique({ where: { id: input.approverId } });
  if (!approver) throw ApiError.badRequest('Assignee (user) not found');
  const mark = (input.paragraphMark ?? '').trim().toUpperCase() || '—';
  const role = input.role === 'CHECKER' ? 'CHECKER' : 'APPROVER';
  const where = mark === '—' ? `Note ${note.noteNumber}` : `paragraph ${mark} of Note ${note.noteNumber}`;

  await prisma.$transaction(async (tx) => {
    await tx.paragraphApproval.deleteMany({ where: { noteId, paragraphMark: mark, status: 'PENDING' } });
    await tx.paragraphApproval.create({
      data: { noteId, paragraphMark: mark, role, status: 'PENDING', assignedToId: approver.id, assignedToName: approver.name },
    });
    await tx.movement.create({
      data: { fileId, type: 'ASSIGN', actorId: user.id, actorName: user.name, toUserId: approver.id, toName: approver.name, noteNumber: note.noteNumber, remarks: `Assigned ${approver.name} as ${role} for ${where}` },
    });
    if (approver.id !== user.id) await tx.notification.create(notifyData(approver.id, 'ASSIGN', `You were assigned as ${role} for ${where}: ${file.subject}`, fileId));
  });

  return getFileDetail(fileId, user);
}

/** Comment on a note — append-only. */
export async function addNoteComment(fileId: string, noteId: string, input: { comment: string }, user: AuthUser) {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) throw ApiError.notFound('File not found');
  if (file.status === 'CLOSED') throw ApiError.badRequest('File is closed');
  const note = await prisma.note.findFirst({ where: { id: noteId, fileId } });
  if (!note) throw ApiError.notFound('Note not found');
  await prisma.checkerComment.create({
    data: { noteId, authorId: user.id, authorName: user.name, comment: input.comment, action: 'comment' },
  });
  await prisma.movement.create({ data: { fileId, type: 'NOTE_ADDED', actorId: user.id, actorName: user.name, noteNumber: note.noteNumber, remarks: `Commented on Note ${note.noteNumber}` } });
  if (file.createdById !== user.id) {
    await prisma.notification.create(notifyData(file.createdById, 'COMMENT', `New comment on your file: ${file.subject}`, fileId));
  }
  return getFileDetail(fileId, user);
}
