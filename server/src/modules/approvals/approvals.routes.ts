import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { asyncHandler, ApiError } from '../../utils/http.js';
import { addNoteComment, uploadMdApproval } from './approvals.service.js';

export const approvalsRouter = Router({ mergeParams: true });

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

approvalsRouter.post('/md-approval', upload.single('file'), asyncHandler(async (req, res) => {
  if (req.file && req.file.mimetype !== 'application/pdf') throw ApiError.badRequest('Phase 1 supports PDF only');
  const remarks = (req.body?.remarks as string) || undefined;
  const file = await uploadMdApproval(req.params.id, { remarks }, req.file?.buffer, req.user!);
  res.status(201).json({ file });
}));

approvalsRouter.post('/notes/:noteId/comments', asyncHandler(async (req, res) => {
  const input = z.object({ comment: z.string().min(1) }).parse(req.body);
  const file = await addNoteComment(req.params.id, req.params.noteId, input, req.user!);
  res.status(201).json({ file });
}));
