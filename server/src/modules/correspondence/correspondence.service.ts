import { prisma } from '../../prisma.js';
import { ApiError } from '../../utils/http.js';
import type { AuthUser } from '../../middleware/auth.js';
import { storage } from '../../services/storage.js';

export interface AddCorrespondenceInput {
  type: string;
  title: string;
  inwardDate?: string;
  inwardNumber?: string;
  emailReference?: string; // when attaching an email as correspondence (C12) instead of a PDF
}

/** Add the next C/n on the correspondence side. Phase 1: PDF file OR an email reference. */
export async function addCorrespondence(
  fileId: string,
  input: AddCorrespondenceInput,
  fileBuffer: Buffer | undefined,
  user: AuthUser,
) {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) throw ApiError.notFound('File not found');
  if (file.status === 'CLOSED') throw ApiError.badRequest('File is closed');

  const count = await prisma.correspondence.count({ where: { fileId } });
  const number = `C/${count + 1}`;

  let storageKey: string | null = null;
  if (fileBuffer) {
    storageKey = await storage.save(fileBuffer, 'pdf');
  } else if (!input.emailReference) {
    throw ApiError.badRequest('Provide a PDF file or an email reference');
  }

  const corr = await prisma.$transaction(async (tx) => {
    const c = await tx.correspondence.create({
      data: {
        fileId,
        number,
        type: input.type,
        title: input.title,
        inwardDate: input.inwardDate ? new Date(input.inwardDate) : null,
        inwardNumber: input.inwardNumber || null,
        storageKey,
        mime: storageKey ? 'application/pdf' : 'text/reference',
        uploadedById: user.id,
        uploadedByName: user.name,
      },
    });
    await tx.movement.create({
      data: {
        fileId,
        type: 'UPLOAD',
        actorId: user.id,
        actorName: user.name,
        remarks: `${number} added (${input.type})`,
      },
    });
    await tx.file.update({ where: { id: fileId }, data: { lastUsedAt: new Date() } });
    return c;
  });

  return {
    id: corr.id,
    number: corr.number,
    type: corr.type,
    title: corr.title,
    inwardDate: corr.inwardDate,
    inwardNumber: corr.inwardNumber,
    storageKey: corr.storageKey,
  };
}

export async function getCorrespondenceFile(fileId: string, corrId: string) {
  const c = await prisma.correspondence.findFirst({ where: { id: corrId, fileId } });
  if (!c) throw ApiError.notFound('Correspondence not found');
  if (!c.storageKey || !storage.exists(c.storageKey)) throw ApiError.notFound('No file attached');
  return {
    path: storage.resolve(c.storageKey),
    mime: c.mime,
    filename: `${c.number.replace('/', '-')}.pdf`,
  };
}
