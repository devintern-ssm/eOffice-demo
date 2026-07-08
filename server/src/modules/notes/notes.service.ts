import { prisma } from '../../prisma.js';
import { ApiError } from '../../utils/http.js';
import type { AuthUser } from '../../middleware/auth.js';
import { getFileDetail } from '../files/files.service.js';

export interface AddNoteInput {
  content: string;
  isDraft?: boolean;
  isSuoMoto?: boolean;
  references?: { correspondence?: string[]; notes?: string[] };
}

/** Add the next sequential note on the noting side (holder-only). */
export async function addNote(fileId: string, input: AddNoteInput, user: AuthUser) {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) throw ApiError.notFound('File not found');
  if (file.status === 'CLOSED') throw ApiError.badRequest('File is closed');
  // Single-holder model (H6): only the current holder may add a note.
  if (file.currentHolderId && file.currentHolderId !== user.id) {
    throw ApiError.forbidden('Only the current file holder can add a note');
  }

  const last = await prisma.note.findFirst({ where: { fileId }, orderBy: { noteNumber: 'desc' } });
  const noteNumber = (last?.noteNumber ?? 0) + 1;

  const refs = [
    ...(input.references?.correspondence ?? []).map((r) => ({ targetType: 'CORRESPONDENCE', targetRef: r })),
    ...(input.references?.notes ?? []).map((r) => ({ targetType: 'NOTE', targetRef: r })),
  ];

  const note = await prisma.$transaction(async (tx) => {
    const n = await tx.note.create({
      data: {
        fileId,
        noteNumber,
        content: input.content,
        authorId: user.id,
        authorName: user.name,
        authorRole: user.role,
        status: input.isDraft ? 'DRAFT' : 'SUBMITTED',
        isSuoMoto: input.isSuoMoto ?? false,
        submittedAt: input.isDraft ? null : new Date(),
        references: { create: refs },
      },
    });
    await tx.movement.create({
      data: {
        fileId,
        type: 'NOTE_ADDED',
        actorId: user.id,
        actorName: user.name,
        remarks: `Note ${noteNumber} ${input.isDraft ? 'saved as draft' : 'added'}`,
      },
    });
    await tx.file.update({ where: { id: fileId }, data: { lastUsedAt: new Date() } });
    return n;
  });

  return {
    id: note.id,
    noteNumber: note.noteNumber,
    status: note.status,
    isDraft: note.status === 'DRAFT',
  };
}

/** Edit a note's content — only its author, only while it is a DRAFT or the file is REVERTED
 *  (C16: "reverted drafts are changed by maker"). Requires holding the file. */
export async function updateNote(fileId: string, noteId: string, input: { content: string }, user: AuthUser) {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) throw ApiError.notFound('File not found');
  if (file.status === 'CLOSED') throw ApiError.badRequest('File is closed');
  const note = await prisma.note.findFirst({ where: { id: noteId, fileId } });
  if (!note) throw ApiError.notFound('Note not found');
  if (note.authorId !== user.id) throw ApiError.forbidden('Only the author can edit this note');
  const editable = note.status === 'DRAFT' || file.status === 'REVERTED';
  if (!editable) throw ApiError.badRequest('Only a draft note, or notes on a reverted file, can be edited');
  if (file.currentHolderId && file.currentHolderId !== user.id) {
    throw ApiError.forbidden('You can only edit while you hold the file');
  }
  if (!input.content.trim()) throw ApiError.badRequest('Note content is required');

  await prisma.$transaction(async (tx) => {
    await tx.note.update({ where: { id: noteId }, data: { content: input.content } });
    await tx.movement.create({
      data: { fileId, type: 'NOTE_ADDED', actorId: user.id, actorName: user.name, remarks: `Note ${note.noteNumber} edited` },
    });
    await tx.file.update({ where: { id: fileId }, data: { lastUsedAt: new Date() } });
  });

  return getFileDetail(fileId, user);
}

/** Submit a saved draft note — DRAFT -> SUBMITTED (author + current holder only). */
export async function submitNote(fileId: string, noteId: string, user: AuthUser) {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) throw ApiError.notFound('File not found');
  if (file.status === 'CLOSED') throw ApiError.badRequest('File is closed');
  const note = await prisma.note.findFirst({ where: { id: noteId, fileId } });
  if (!note) throw ApiError.notFound('Note not found');
  if (note.status !== 'DRAFT') throw ApiError.badRequest('Only a draft note can be submitted');
  if (note.authorId !== user.id) throw ApiError.forbidden('Only the author can submit their draft note');
  if (file.currentHolderId && file.currentHolderId !== user.id) {
    throw ApiError.forbidden('You can only submit your draft while you hold the file');
  }

  await prisma.$transaction(async (tx) => {
    await tx.note.update({ where: { id: noteId }, data: { status: 'SUBMITTED', submittedAt: new Date() } });
    await tx.movement.create({
      data: { fileId, type: 'NOTE_ADDED', actorId: user.id, actorName: user.name, remarks: `Note ${note.noteNumber} submitted` },
    });
    await tx.file.update({ where: { id: fileId }, data: { lastUsedAt: new Date() } });
  });

  return { id: note.id, noteNumber: note.noteNumber, status: 'SUBMITTED' };
}
