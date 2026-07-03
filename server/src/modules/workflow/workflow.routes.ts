import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/http.js';
import { STEP_ROLES } from '../../utils/domain.js';
import { actOnFile, addReviewer, forwardFile, removeStep } from './workflow.service.js';

// mergeParams so req.params.id (the fileId) is available from the parent router.
export const workflowRouter = Router({ mergeParams: true });

const forwardSchema = z.object({
  recipients: z.array(z.object({ userId: z.string(), role: z.enum(STEP_ROLES).optional() })).default([]),
  remarks: z.string().optional(),
});

const addReviewerSchema = z.object({
  userId: z.string(),
  role: z.enum(STEP_ROLES).optional(),
});

const actionSchema = z.object({
  action: z.enum(['check', 'approve', 'revert', 'reject', 'clarify']),
  remarks: z.string().optional(),
  dept: z.string().optional(),
  signatureName: z.string().optional(),
  paragraphs: z.array(z.string()).optional(),
});

workflowRouter.post('/forward', asyncHandler(async (req, res) => {
  const input = forwardSchema.parse(req.body);
  const file = await forwardFile(req.params.id, input, req.user!);
  res.json({ file });
}));

workflowRouter.post('/steps', asyncHandler(async (req, res) => {
  const input = addReviewerSchema.parse(req.body);
  const file = await addReviewer(req.params.id, input, req.user!);
  res.status(201).json({ file });
}));

workflowRouter.delete('/steps/:stepId', asyncHandler(async (req, res) => {
  const file = await removeStep(req.params.id, req.params.stepId, req.user!);
  res.json({ file });
}));

workflowRouter.post('/action', asyncHandler(async (req, res) => {
  const input = actionSchema.parse(req.body);
  const file = await actOnFile(req.params.id, input, req.user!);
  res.json({ file });
}));
