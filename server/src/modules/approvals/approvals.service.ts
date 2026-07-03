import { prisma } from '../../prisma.js';
import { ApiError } from '../../utils/http.js';
import type { AuthUser } from '../../middleware/auth.js';
import { storage } from '../../services/storage.js';
import { getFileDetail } from '../files/files.service.js';

/**
 * MD approval via uploaded scanned offline approval (S11). Any maker/checker may upload it.
 * Stores the scan as a correspondence entry and approves the current pending step offline.
 */
export async function uploadMdApproval(fileId: string, input: { remarks?: string }, fileBuffer: Buffer | undefined, user: AuthUser) {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) throw ApiError.notFound('File not found');
  if (file.status !== 'UNDER_REVIEW') throw ApiError.badRequest('File is not under review');
  if (!fileBuffer) throw ApiError.badRequest('A scanned PDF approval is required');

  const steps = await prisma.workflowStep.findMany({ where: { fileId }, orderBy: { stepOrder: 'asc' } });
  const current = steps.find((s) => s.status === 'PENDING');
  if (!current) throw ApiError.badRequest('No pending step to approve');
  // Must be involved (holder, originator, the current reviewer, or admin).
  if (!(file.currentHolderId === user.id || file.createdById === user.id || current.assigneeId === user.id || user.role === 'ADMIN')) {
    throw ApiError.forbidden('Not allowed to record an approval on this file');
  }

  const storageKey = await storage.save(fileBuffer, 'pdf');

  await prisma.$transaction(async (tx) => {
    const count = await tx.correspondence.count({ where: { fileId } });
    await tx.correspondence.create({
      data: { fileId, number: `C/${count + 1}`, type: 'MD Approval (scanned)', title: input.remarks || 'Offline MD approval', storageKey, mime: 'application/pdf', uploadedById: user.id, uploadedByName: user.name },
    });
    await tx.workflowStep.update({
      where: { id: current.id },
      data: { status: 'APPROVED', remarks: input.remarks || 'Approved offline (scanned MD approval)', dept: user.section, signatureName: `${current.assigneeName} (offline)`, actedAt: new Date() },
    });

    const next = steps.find((s) => s.stepOrder > current.stepOrder && s.status === 'PENDING');
    if (next) {
      await tx.file.update({ where: { id: fileId }, data: { status: 'UNDER_REVIEW', currentHolderId: next.assigneeId, lastUsedAt: new Date() } });
    } else {
      await tx.file.update({ where: { id: fileId }, data: { status: 'APPROVED', currentHolderId: null, lastUsedAt: new Date() } });
    }
    await tx.movement.create({ data: { fileId, type: 'APPROVE', actorId: user.id, actorName: user.name, dept: user.section, remarks: `Offline MD approval uploaded (${current.assigneeName})` } });
  });

  return getFileDetail(fileId);
}

/** Comment on a note after checker approval (S6b / C7) — append-only. */
export async function addNoteComment(fileId: string, noteId: string, input: { comment: string }, user: AuthUser) {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) throw ApiError.notFound('File not found');
  if (file.status === 'CLOSED') throw ApiError.badRequest('File is closed');
  const note = await prisma.note.findFirst({ where: { id: noteId, fileId } });
  if (!note) throw ApiError.notFound('Note not found');
  await prisma.checkerComment.create({
    data: { noteId, authorId: user.id, authorName: user.name, comment: input.comment, action: 'comment' },
  });
  await prisma.movement.create({ data: { fileId, type: 'NOTE_ADDED', actorId: user.id, actorName: user.name, remarks: `Commented on Note ${note.noteNumber}` } });
  return getFileDetail(fileId);
}
