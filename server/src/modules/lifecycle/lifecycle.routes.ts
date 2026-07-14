import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/http.js';
import { closeFile, handoverFile, transferFile } from './lifecycle.service.js';

export const lifecycleRouter = Router({ mergeParams: true });

// Hand an idle binder to another person so they can raise the next note.
lifecycleRouter.post('/handover', asyncHandler(async (req, res) => {
  const input = z.object({ toUserId: z.string(), remarks: z.string().optional() }).parse(req.body);
  res.json({ file: await handoverFile(req.params.id, input, req.user!) });
}));

// Permanent cross-department transfer (changes the binder's current location).
lifecycleRouter.post('/transfer', asyncHandler(async (req, res) => {
  const input = z.object({ toSection: z.string().min(1), toUserId: z.string().optional(), reason: z.string().optional() }).parse(req.body);
  res.json({ file: await transferFile(req.params.id, input, req.user!) });
}));

// Close a binder (rare — a case file at its end).
lifecycleRouter.post('/close', asyncHandler(async (req, res) => {
  const input = z.object({ reason: z.string().min(1), successorFileId: z.string().optional() }).parse(req.body);
  res.json({ file: await closeFile(req.params.id, input, req.user!) });
}));
