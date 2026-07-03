import { prisma } from '../../prisma.js';
import { ApiError } from '../../utils/http.js';
import type { AuthUser } from '../../middleware/auth.js';

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
