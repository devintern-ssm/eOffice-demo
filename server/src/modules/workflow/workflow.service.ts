import { prisma } from '../../prisma.js';
import { ApiError } from '../../utils/http.js';
import type { AuthUser } from '../../middleware/auth.js';
import { getFileDetail } from '../files/files.service.js';
import { notifyData } from '../../services/notify.js';
import { STEP_ROLES } from '../../utils/domain.js';

/** Load the file + its currently in-flight note (IN_REVIEW) with an ordered signer chain. */
async function loadActiveNote(fileId: string) {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) throw ApiError.notFound('File not found');
  const note = await prisma.note.findFirst({
    where: { fileId, status: 'IN_REVIEW' },
    include: { steps: { orderBy: { stepOrder: 'asc' } } },
  });
  return { file, note };
}

interface SignInput { remarks?: string; dept?: string; signatureName?: string }

/**
 * Sign & forward the in-flight note: stamp the active signer's step, then advance to the next
 * signer — or, if this was the last signer, FINALIZE the note and return the file to its maker.
 */
export async function signNote(fileId: string, input: SignInput, user: AuthUser) {
  const { file, note } = await loadActiveNote(fileId);
  if (!note) throw ApiError.badRequest('No note is currently under signature on this file');
  const current = note.steps.find((s) => s.status === 'PENDING');
  if (!current) throw ApiError.badRequest('No pending signatory step');
  if (!((current.signerId === user.id && file.currentHolderId === user.id) || user.role === 'ADMIN')) {
    throw ApiError.forbidden('This note is not awaiting your signature, or you do not currently hold this file');
  }

  await prisma.$transaction(async (tx) => {
    await tx.noteStep.update({
      where: { id: current.id },
      data: {
        status: 'SIGNED',
        remarks: input.remarks || 'Signed',
        dept: input.dept || user.section,
        signatureName: input.signatureName || user.name,
        actedAt: new Date(),
      },
    });

    const next = note.steps.find((s) => s.stepOrder > current.stepOrder && s.status === 'PENDING');
    if (next) {
      await tx.file.update({ where: { id: fileId }, data: { currentHolderId: next.signerId, lastUsedAt: new Date() } });
      await tx.movement.create({
        data: { fileId, type: 'SIGN', actorId: user.id, actorName: user.name, toUserId: next.signerId, toName: next.signerName, dept: input.dept || user.section, noteNumber: note.noteNumber, remarks: input.remarks || `Signed Note ${note.noteNumber}` },
      });
      if (next.signerId !== user.id) {
        await tx.notification.create(notifyData(next.signerId, 'SIGN', `Note ${note.noteNumber} awaits your signature: ${file.subject}`, fileId));
      }
    } else {
      // Last signer → the note is finalized and the file returns to the note's maker.
      await tx.note.update({ where: { id: note.id }, data: { status: 'FINALIZED', finalizedAt: new Date() } });
      await tx.file.update({ where: { id: fileId }, data: { currentHolderId: note.authorId, lastUsedAt: new Date() } });
      await tx.movement.create({
        data: { fileId, type: 'FINALIZE', actorId: user.id, actorName: user.name, toUserId: note.authorId, toName: note.authorName, dept: input.dept || user.section, noteNumber: note.noteNumber, remarks: input.remarks || `Note ${note.noteNumber} finalized` },
      });
      if (note.authorId !== user.id) {
        await tx.notification.create(notifyData(note.authorId, 'FINALIZE', `Note ${note.noteNumber} finalized and returned to you: ${file.subject}`, fileId));
      }
    }
  });

  return getFileDetail(fileId, user);
}

/** Send the in-flight note back to its maker for correction (note → RETURNED). */
export async function returnNote(fileId: string, input: { remarks?: string }, user: AuthUser) {
  const { file, note } = await loadActiveNote(fileId);
  if (!note) throw ApiError.badRequest('No note is currently under signature on this file');
  const current = note.steps.find((s) => s.status === 'PENDING');
  if (!current) throw ApiError.badRequest('No pending signatory step');
  if (!((current.signerId === user.id && file.currentHolderId === user.id) || user.role === 'ADMIN')) {
    throw ApiError.forbidden('This note is not awaiting your signature, or you do not currently hold this file');
  }

  await prisma.$transaction(async (tx) => {
    await tx.noteStep.update({
      where: { id: current.id },
      data: { status: 'RETURNED', remarks: input.remarks || 'Sent back', dept: user.section, signatureName: user.name, actedAt: new Date() },
    });
    // Downstream signers never got their turn — clear their PENDING steps so the returned note
    // doesn't leave phantom "awaiting my signature" entries in their inbox/KPIs.
    await tx.noteStep.updateMany({ where: { noteId: note.id, status: 'PENDING' }, data: { status: 'RETURNED' } });
    await tx.note.update({ where: { id: note.id }, data: { status: 'RETURNED' } });
    await tx.file.update({ where: { id: fileId }, data: { currentHolderId: note.authorId, lastUsedAt: new Date() } });
    await tx.movement.create({
      data: { fileId, type: 'RETURN_NOTE', actorId: user.id, actorName: user.name, toUserId: note.authorId, toName: note.authorName, dept: user.section, noteNumber: note.noteNumber, remarks: input.remarks || `Note ${note.noteNumber} sent back` },
    });
    if (note.authorId !== user.id) {
      await tx.notification.create(notifyData(note.authorId, 'RETURN', `Note ${note.noteNumber} sent back to you: ${input.remarks || file.subject}`, fileId));
    }
  });

  return getFileDetail(fileId, user);
}

/** Append a signer to the in-flight note's chain (the active signer or the note's maker). */
export async function addSigner(fileId: string, input: { userId: string; roleLabel?: string }, user: AuthUser) {
  const { file, note } = await loadActiveNote(fileId);
  if (!note) throw ApiError.badRequest('No note is currently under signature on this file');
  const isActiveSigner = file.currentHolderId === user.id;
  if (!(isActiveSigner || note.authorId === user.id || user.role === 'ADMIN')) {
    throw ApiError.forbidden('Only the current holder or the note maker can add a signer');
  }
  const u = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!u) throw ApiError.badRequest('User not found');
  const roleLabel = input.roleLabel?.trim()
    || ((STEP_ROLES as readonly string[]).includes(u.role) ? u.role : 'Signatory');

  await prisma.$transaction(async (tx) => {
    const agg = await tx.noteStep.aggregate({ where: { noteId: note.id }, _max: { stepOrder: true } });
    const order = (agg._max.stepOrder ?? 0) + 1;
    await tx.noteStep.create({
      data: { noteId: note.id, fileId, stepOrder: order, signerId: u.id, signerName: u.name, roleLabel, status: 'PENDING' },
    });
    await tx.movement.create({
      data: { fileId, type: 'ASSIGN', actorId: user.id, actorName: user.name, toUserId: u.id, toName: u.name, noteNumber: note.noteNumber, remarks: `Added ${u.name} to the signature chain of Note ${note.noteNumber}` },
    });
    if (u.id !== user.id) await tx.notification.create(notifyData(u.id, 'ASSIGN', `You were added as a signer on Note ${note.noteNumber}: ${file.subject}`, fileId));
    await tx.file.update({ where: { id: fileId }, data: { lastUsedAt: new Date() } });
  });

  return getFileDetail(fileId, user);
}
