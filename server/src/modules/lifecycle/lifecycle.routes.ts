import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/http.js';
import { closeFile, returnToMaker, routeToDept, transferFile } from './lifecycle.service.js';

export const lifecycleRouter = Router({ mergeParams: true });

lifecycleRouter.post('/route', asyncHandler(async (req, res) => {
  const input = z.object({ toUserId: z.string(), remarks: z.string().optional() }).parse(req.body);
  res.json({ file: await routeToDept(req.params.id, input, req.user!) });
}));

lifecycleRouter.post('/return', asyncHandler(async (req, res) => {
  const input = z.object({ remarks: z.string().optional() }).parse(req.body);
  res.json({ file: await returnToMaker(req.params.id, input, req.user!) });
}));

lifecycleRouter.post('/transfer', asyncHandler(async (req, res) => {
  const input = z.object({ toSection: z.string().min(1), toUserId: z.string().optional(), reason: z.string().optional() }).parse(req.body);
  res.json({ file: await transferFile(req.params.id, input, req.user!) });
}));

lifecycleRouter.post('/close', asyncHandler(async (req, res) => {
  const input = z.object({ reason: z.string().min(1), successorFileId: z.string().optional() }).parse(req.body);
  res.json({ file: await closeFile(req.params.id, input, req.user!) });
}));
