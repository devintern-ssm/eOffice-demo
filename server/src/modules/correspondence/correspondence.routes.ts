import { Router } from 'express';
import multer from 'multer';
import { asyncHandler, ApiError } from '../../utils/http.js';
import { addCorrespondence, getCorrespondenceFile } from './correspondence.service.js';

// mergeParams so req.params.id (the fileId) is available from the parent router.
export const correspondenceRouter = Router({ mergeParams: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
});

// Phase 1 accepts ALL file formats (client decision A5). PDFs get automatic page
// counting; any other format is stored and offered for download/preview as-is.
correspondenceRouter.post('/', upload.single('file'), asyncHandler(async (req, res) => {
  const { type, title, inwardDate, inwardNumber, emailReference } = req.body as Record<string, string>;
  if (!type || !title) throw ApiError.badRequest('type and title are required');

  const corr = await addCorrespondence(
    req.params.id,
    { type, title, inwardDate, inwardNumber, emailReference },
    req.file ? { buffer: req.file.buffer, mimetype: req.file.mimetype, originalname: req.file.originalname } : undefined,
    req.user!,
  );
  res.status(201).json({ correspondence: corr });
}));

correspondenceRouter.get('/:corrId/file', asyncHandler(async (req, res) => {
  const { buffer, mime, filename } = await getCorrespondenceFile(req.params.id, req.params.corrId);
  res.setHeader('Content-Type', mime);
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.send(buffer);
}));
