import { prisma } from '../../prisma.js';
import { ApiError } from '../../utils/http.js';
import type { AuthUser } from '../../middleware/auth.js';
import { storage } from '../../services/storage.js';
import { countPdfPages } from '../../services/pdf.js';
import { extForAttachment } from '../../utils/domain.js';

export interface AddCorrespondenceInput {
  type: string;
  title: string;
  inwardDate?: string;
  inwardNumber?: string;
  emailReference?: string; // when attaching an email as correspondence (C12) instead of a file
}

export interface UploadedFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

/** Add the next C/n on the correspondence side. A multi-format file (review #6) OR an email reference. */
export async function addCorrespondence(
  fileId: string,
  input: AddCorrespondenceInput,
  upload: UploadedFile | undefined,
  user: AuthUser,
) {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) throw ApiError.notFound('File not found');
  if (file.status === 'CLOSED') throw ApiError.badRequest('File is closed');

  const count = await prisma.correspondence.count({ where: { fileId } });
  const number = `C/${count + 1}`; // internal attachment index; display uses derived C-range
  const seq = count;               // attachment order for page-level C-numbering

  let storageKey: string | null = null;
  let mime = 'text/reference';
  let originalName: string | null = null;
  let pageCount: number | null = null;

  if (upload) {
    const ext = extForAttachment(upload.mimetype, upload.originalname);
    storageKey = await storage.save(upload.buffer, ext);
    mime = upload.mimetype;
    originalName = upload.originalname;
    // Continuous paging (review #7): count real PDF pages; a non-PDF attachment counts as one unit.
    if (upload.mimetype === 'application/pdf') {
      pageCount = (await countPdfPages(upload.buffer)) ?? 1;
    } else {
      pageCount = 1;
    }
  } else if (!input.emailReference) {
    throw ApiError.badRequest('Provide a file or an email reference');
  }

  const corr = await prisma.$transaction(async (tx) => {
    const c = await tx.correspondence.create({
      data: {
        fileId,
        number,
        seq,
        type: input.type,
        title: input.title,
        inwardDate: input.inwardDate ? new Date(input.inwardDate) : null,
        inwardNumber: input.inwardNumber || null,
        storageKey,
        mime,
        originalName,
        pageCount,
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
    mime: corr.mime,
    originalName: corr.originalName,
    pageCount: corr.pageCount,
  };
}

export async function getCorrespondenceFile(fileId: string, corrId: string) {
  const c = await prisma.correspondence.findFirst({ where: { id: corrId, fileId } });
  if (!c) throw ApiError.notFound('Correspondence not found');
  if (!c.storageKey) throw ApiError.notFound('No file attached');
  const buffer = await storage.read(c.storageKey);
  if (!buffer) throw ApiError.notFound('No file attached');
  const ext = extForAttachment(c.mime, c.originalName ?? undefined);
  return {
    buffer,
    mime: c.mime,
    filename: c.originalName || `${c.number.replace('/', '-')}.${ext}`,
  };
}
