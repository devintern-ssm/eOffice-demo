import { PDFDocument } from 'pdf-lib';

/**
 * Count the pages in a PDF buffer. Returns null if the buffer isn't a parseable
 * PDF (e.g. a Word/Excel/image attachment) so the caller can decide how to page it.
 * Drives continuous page numbering across correspondence (review #7).
 */
export async function countPdfPages(buffer: Buffer): Promise<number | null> {
  try {
    const doc = await PDFDocument.load(buffer, { ignoreEncryption: true, updateMetadata: false });
    return doc.getPageCount();
  } catch {
    return null;
  }
}
