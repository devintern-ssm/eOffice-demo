import type { File } from '@prisma/client';
import { prisma } from '../../prisma.js';
import { ApiError } from '../../utils/http.js';
import type { AuthUser } from '../../middleware/auth.js';
import { getFileDetail } from '../files/files.service.js';
import { notifyData } from '../../services/notify.js';

/** Only the current holder (or an admin) may drive lifecycle actions on a binder at rest. */
function assertHolder(file: File, user: AuthUser) {
  if (!(file.currentHolderId === user.id || user.role === 'ADMIN')) {
    throw ApiError.forbidden('Only the current holder can perform this action');
  }
}

/** A note in flight (IN_REVIEW/RETURNED) pins the file to the workflow — block at-rest actions. */
async function assertNoNoteInFlight(fileId: string) {
  const inFlight = await prisma.note.findFirst({ where: { fileId, status: { in: ['IN_REVIEW', 'RETURNED'] } } });
  if (inFlight) throw ApiError.badRequest(`Note ${inFlight.noteNumber} is in progress — it must be finished first`);
}

/**
 * Hand an idle binder to another person so they can raise the next note (A2). The file must be
 * at rest (no note in flight). Holder-only; the recipient becomes the new holder.
 */
export async function handoverFile(fileId: string, input: { toUserId: string; remarks?: string }, user: AuthUser) {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) throw ApiError.notFound('File not found');
  if (file.status === 'CLOSED') throw ApiError.badRequest('File is closed');
  assertHolder(file, user);
  await assertNoNoteInFlight(fileId);
  const to = await prisma.user.findUnique({ where: { id: input.toUserId } });
  if (!to) throw ApiError.badRequest('Recipient not found');

  await prisma.$transaction([
    prisma.file.update({ where: { id: fileId }, data: { currentHolderId: to.id, lastUsedAt: new Date() } }),
    prisma.movement.create({ data: { fileId, type: 'HANDOVER', actorId: user.id, actorName: user.name, toUserId: to.id, toName: to.name, toSection: to.section, remarks: input.remarks || `Handed over to ${to.name}` } }),
    ...(to.id !== user.id ? [prisma.notification.create(notifyData(to.id, 'HANDOVER', `A file was handed over to you: ${file.subject}`, fileId))] : []),
  ]);
  return getFileDetail(fileId, user);
}

/** Permanent cross-department transfer — the binder's current location (section) changes. */
export async function transferFile(fileId: string, input: { toSection: string; toUserId?: string; reason?: string }, user: AuthUser) {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) throw ApiError.notFound('File not found');
  if (file.status === 'CLOSED') throw ApiError.badRequest('File is closed');
  assertHolder(file, user);
  await assertNoNoteInFlight(fileId);
  const to = input.toUserId ? await prisma.user.findUnique({ where: { id: input.toUserId } }) : null;

  await prisma.$transaction([
    prisma.file.update({ where: { id: fileId }, data: { section: input.toSection, currentHolderId: to?.id ?? file.currentHolderId, lastUsedAt: new Date() } }),
    prisma.movement.create({ data: { fileId, type: 'TRANSFER', actorId: user.id, actorName: user.name, fromSection: file.section, toSection: input.toSection, toUserId: to?.id, toName: to?.name, remarks: input.reason || `Transferred to ${input.toSection}` } }),
    ...(to && to.id !== user.id ? [prisma.notification.create(notifyData(to.id, 'HANDOVER', `File transferred to you (${input.toSection}): ${file.subject}`, fileId))] : []),
  ]);
  return getFileDetail(fileId, user);
}

/** Close a binder (rare — a case file at its end). Requires no note in flight (O5). Read-only after. */
export async function closeFile(fileId: string, input: { reason: string; successorFileId?: string }, user: AuthUser) {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) throw ApiError.notFound('File not found');
  if (file.status === 'CLOSED') throw ApiError.badRequest('File is already closed');
  if (!(file.currentHolderId === user.id || file.createdById === user.id || user.role === 'ADMIN')) {
    throw ApiError.forbidden('Only the current holder or the originator can close this file');
  }
  await assertNoNoteInFlight(fileId);
  if (input.successorFileId) {
    const succ = await prisma.file.findUnique({ where: { id: input.successorFileId } });
    if (!succ) throw ApiError.badRequest('Successor file not found');
  }

  await prisma.$transaction([
    prisma.file.update({
      where: { id: fileId },
      data: { status: 'CLOSED', closeDate: new Date(), closeReason: input.reason, successorFileId: input.successorFileId ?? null, currentHolderId: null, lastUsedAt: new Date() },
    }),
    prisma.movement.create({ data: { fileId, type: 'CLOSE', actorId: user.id, actorName: user.name, remarks: input.reason || 'File closed' } }),
  ]);
  return getFileDetail(fileId, user);
}
