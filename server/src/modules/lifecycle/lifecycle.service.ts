import type { File } from '@prisma/client';
import { prisma } from '../../prisma.js';
import { ApiError } from '../../utils/http.js';
import type { AuthUser } from '../../middleware/auth.js';
import { getFileDetail } from '../files/files.service.js';
import { notifyData } from '../../services/notify.js';

/** Only the current holder, the originator, or an admin may drive lifecycle actions. */
function assertHolderOrMaker(file: File, user: AuthUser) {
  if (!(file.currentHolderId === user.id || file.createdById === user.id || user.role === 'ADMIN')) {
    throw ApiError.forbidden('Only the current holder or the originator can perform this action');
  }
}

/** Post-approval routing to an actionable department for implementation (S19/H14). APPROVED -> ROUTED. */
export async function routeToDept(fileId: string, input: { toUserId: string; remarks?: string }, user: AuthUser) {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) throw ApiError.notFound('File not found');
  if (file.status !== 'APPROVED') throw ApiError.badRequest('Only an approved file can be routed for implementation');
  assertHolderOrMaker(file, user);
  const to = await prisma.user.findUnique({ where: { id: input.toUserId } });
  if (!to) throw ApiError.badRequest('Recipient not found');

  await prisma.$transaction([
    prisma.file.update({ where: { id: fileId }, data: { status: 'ROUTED', currentHolderId: to.id, lastUsedAt: new Date() } }),
    prisma.movement.create({ data: { fileId, type: 'ROUTE', actorId: user.id, actorName: user.name, toUserId: to.id, toName: to.name, toSection: to.section, remarks: input.remarks || 'Routed for implementation' } }),
    ...(to.id !== user.id ? [prisma.notification.create(notifyData(to.id, 'ROUTE', `File routed to you for action: ${file.subject}`, fileId))] : []),
  ]);
  return getFileDetail(fileId, user);
}

/** After implementation/comments, return the file to the originator (S19). ROUTED -> RETURNED. */
export async function returnToMaker(fileId: string, input: { remarks?: string }, user: AuthUser) {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) throw ApiError.notFound('File not found');
  if (file.status !== 'ROUTED') throw ApiError.badRequest('Only a routed file can be returned to the maker');
  if (!(file.currentHolderId === user.id || user.role === 'ADMIN')) {
    throw ApiError.forbidden('Only the actionable-department holder can return this file');
  }
  const maker = await prisma.user.findUnique({ where: { id: file.createdById } });

  await prisma.$transaction([
    prisma.file.update({ where: { id: fileId }, data: { status: 'RETURNED', currentHolderId: file.createdById, lastUsedAt: new Date() } }),
    prisma.movement.create({ data: { fileId, type: 'RETURN', actorId: user.id, actorName: user.name, toUserId: file.createdById, toName: maker?.name, remarks: input.remarks || 'Implemented; returned to originator' } }),
    ...(file.createdById !== user.id ? [prisma.notification.create(notifyData(file.createdById, 'RETURN', `File returned to you: ${file.subject}`, fileId))] : []),
  ]);
  return getFileDetail(fileId, user);
}

/** Permanent cross-department transfer (SD Additional Points / D11). Number is unchanged. */
export async function transferFile(fileId: string, input: { toSection: string; toUserId?: string; reason?: string }, user: AuthUser) {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) throw ApiError.notFound('File not found');
  if (file.status === 'CLOSED') throw ApiError.badRequest('File is closed');
  assertHolderOrMaker(file, user);
  const to = input.toUserId ? await prisma.user.findUnique({ where: { id: input.toUserId } }) : null;

  await prisma.$transaction([
    prisma.file.update({ where: { id: fileId }, data: { section: input.toSection, currentHolderId: to?.id ?? file.currentHolderId, lastUsedAt: new Date() } }),
    prisma.movement.create({ data: { fileId, type: 'TRANSFER', actorId: user.id, actorName: user.name, fromSection: file.section, toSection: input.toSection, toUserId: to?.id, toName: to?.name, remarks: input.reason || `Transferred to ${input.toSection}` } }),
    ...(to && to.id !== user.id ? [prisma.notification.create(notifyData(to.id, 'ASSIGN', `File transferred to you (${input.toSection}): ${file.subject}`, fileId))] : []),
  ]);
  return getFileDetail(fileId, user);
}

/** Close a file (SD §9 / H17): records close date + reason + optional successor link; read-only afterwards. */
export async function closeFile(fileId: string, input: { reason: string; successorFileId?: string }, user: AuthUser) {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) throw ApiError.notFound('File not found');
  if (file.status === 'CLOSED') throw ApiError.badRequest('File is already closed');
  assertHolderOrMaker(file, user);
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
