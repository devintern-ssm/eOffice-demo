import { prisma } from '../../prisma.js';
import { ApiError } from '../../utils/http.js';
import type { AuthUser } from '../../middleware/auth.js';
import { storage } from '../../services/storage.js';
import { getFileDetail } from '../files/files.service.js';
import { notifyData } from '../../services/notify.js';

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
      if (next.assigneeId !== user.id) await tx.notification.create(notifyData(next.assigneeId, 'FORWARD', `Forwarded to you for review: ${file.subject}`, fileId));
    } else {
      await tx.file.update({ where: { id: fileId }, data: { status: 'APPROVED', currentHolderId: null, lastUsedAt: new Date() } });
      if (file.createdById !== user.id) await tx.notification.create(notifyData(file.createdById, 'APPROVE', `Your file was approved: ${file.subject}`, fileId));
    }
    await tx.movement.create({ data: { fileId, type: 'APPROVE', actorId: user.id, actorName: user.name, dept: user.section, remarks: `Offline MD approval uploaded (${current.assigneeName})` } });
  });

  return getFileDetail(fileId, user);
}

/**
 * Assign a paragraph-wise approver to a note (review #2). Creates a PENDING paragraph
 * approval targeted at a specific user; it becomes APPROVED when that person approves.
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
  // Only the current holder / originator may plan note reviewers.
  if (!(file.currentHolderId === user.id || file.createdById === user.id)) {
    throw ApiError.forbidden('Only the current holder can assign a note reviewer');
  }
  const note = await prisma.note.findFirst({ where: { id: noteId, fileId } });
  if (!note) throw ApiError.notFound('Note not found');
  const approver = await prisma.user.findUnique({ where: { id: input.approverId } });
  if (!approver) throw ApiError.badRequest('Assignee (user) not found');
  const mark = (input.paragraphMark ?? '').trim().toUpperCase() || '—'; // '—' = whole note (observation #6)
  const role = input.role === 'CHECKER' ? 'CHECKER' : 'APPROVER';
  const where = mark === '—' ? `Note ${note.noteNumber}` : `paragraph ${mark} of Note ${note.noteNumber}`;

  await prisma.$transaction(async (tx) => {
    // Replace any prior PENDING assignment for the same note/paragraph.
    await tx.paragraphApproval.deleteMany({ where: { noteId, paragraphMark: mark, status: 'PENDING' } });
    await tx.paragraphApproval.create({
      data: { noteId, paragraphMark: mark, role, status: 'PENDING', assignedToId: approver.id, assignedToName: approver.name },
    });
    await tx.movement.create({
      data: {
        fileId, type: 'ASSIGN', actorId: user.id, actorName: user.name,
        toUserId: approver.id, toName: approver.name,
        remarks: `Assigned ${approver.name} as ${role} for ${where}`,
      },
    });
    if (approver.id !== user.id) await tx.notification.create(notifyData(approver.id, 'ASSIGN', `You were assigned as ${role} for ${where}: ${file.subject}`, fileId));
  });

  return getFileDetail(fileId, user);
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
  if (file.createdById !== user.id) {
    await prisma.notification.create(notifyData(file.createdById, 'COMMENT', `New comment on your file: ${file.subject}`, fileId));
  }
  return getFileDetail(fileId, user);
}
