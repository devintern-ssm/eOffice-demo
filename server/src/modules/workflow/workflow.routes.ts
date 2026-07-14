import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/http.js';
import { addSigner, returnNote, signNote } from './workflow.service.js';

// mergeParams so req.params.id (the fileId) is available from the parent router.
export const workflowRouter = Router({ mergeParams: true });

const signSchema = z.object({
  remarks: z.string().optional(),
  dept: z.string().optional(),
  signatureName: z.string().optional(),
});

// Sign & forward the in-flight note (advance the chain, or finalize on the last signer).
workflowRouter.post('/sign', asyncHandler(async (req, res) => {
  const input = signSchema.parse(req.body);
  const file = await signNote(req.params.id, input, req.user!);
  res.json({ file });
}));

// Send the in-flight note back to its maker.
workflowRouter.post('/return', asyncHandler(async (req, res) => {
  const input = z.object({ remarks: z.string().optional() }).parse(req.body);
  const file = await returnNote(req.params.id, input, req.user!);
  res.json({ file });
}));

// Append a signer to the in-flight note's chain.
workflowRouter.post('/signers', asyncHandler(async (req, res) => {
  const input = z.object({ userId: z.string(), roleLabel: z.string().optional() }).parse(req.body);
  const file = await addSigner(req.params.id, input, req.user!);
  res.status(201).json({ file });
}));
