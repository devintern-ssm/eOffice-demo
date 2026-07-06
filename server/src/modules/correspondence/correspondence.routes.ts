import { Router } from 'express';
import multer from 'multer';
import { asyncHandler, ApiError } from '../../utils/http.js';
import { isAllowedAttachment, ATTACHMENT_TYPES } from '../../utils/domain.js';
import { addCorrespondence, getCorrespondenceFile } from './correspondence.service.js';

// mergeParams so req.params.id (the fileId) is available from the parent router.
export const correspondenceRouter = Router({ mergeParams: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

correspondenceRouter.post('/', upload.single('file'), asyncHandler(async (req, res) => {
  const { type, title, inwardDate, inwardNumber, emailReference } = req.body as Record<string, string>;
  if (!type || !title) throw ApiError.badRequest('type and title are required');

  if (req.file && !isAllowedAttachment(req.file.mimetype)) {
    const allowed = Object.values(ATTACHMENT_TYPES).join(', ');
    throw ApiError.badRequest(`Unsupported file type. Allowed: ${allowed}`);
  }

  const corr = await addCorrespondence(
    req.params.id,
    { type, title, inwardDate, inwardNumber, emailReference },
    req.file ? { buffer: req.file.buffer, mimetype: req.file.mimetype, originalname: req.file.originalname } : undefined,
    req.user!,
  );
  res.status(201).json({ correspondence: corr });
}));

correspondenceRouter.get('/:corrId/file', asyncHandler(async (req, res) => {
  const { path, mime, filename } = await getCorrespondenceFile(req.params.id, req.params.corrId);
  res.setHeader('Content-Type', mime);
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.sendFile(path);
}));
