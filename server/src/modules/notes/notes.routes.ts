import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/http.js';
import { addNote, submitNote, updateNote } from './notes.service.js';

// mergeParams so req.params.id (the fileId) is available from the parent router.
export const notesRouter = Router({ mergeParams: true });

const signersSchema = z.array(z.object({ userId: z.string(), roleLabel: z.string().optional() })).optional();

const addNoteSchema = z.object({
  content: z.string().trim().min(1),
  isDraft: z.boolean().optional(),
  isSuoMoto: z.boolean().optional(),
  references: z
    .object({
      correspondence: z.array(z.string()).optional(),
      notes: z.array(z.string()).optional(),
    })
    .optional(),
  signers: signersSchema, // when not a draft, the note is put up for signature to these people
});

// Open the next note (optionally submit it immediately with a signer chain).
notesRouter.post('/', asyncHandler(async (req, res) => {
  const input = addNoteSchema.parse(req.body);
  const file = await addNote(req.params.id, input, req.user!);
  res.status(201).json({ file });
}));

// Put a saved draft / returned note up for signature.
notesRouter.post('/:noteId/submit', asyncHandler(async (req, res) => {
  const input = z.object({ signers: signersSchema, remarks: z.string().optional() }).parse(req.body ?? {});
  const file = await submitNote(req.params.id, req.params.noteId, input, req.user!);
  res.json({ file });
}));

// Edit a draft / returned note's content or references.
notesRouter.patch('/:noteId', asyncHandler(async (req, res) => {
  const input = z.object({
    content: z.string().min(1).optional(),
    references: z.object({ correspondence: z.array(z.string()).optional(), notes: z.array(z.string()).optional() }).optional(),
  }).parse(req.body);
  const file = await updateNote(req.params.id, req.params.noteId, input, req.user!);
  res.json({ file });
}));
