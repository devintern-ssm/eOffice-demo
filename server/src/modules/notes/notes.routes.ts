import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/http.js';
import { addNote, submitNote, updateNote } from './notes.service.js';

// mergeParams so req.params.id (the fileId) is available from the parent router.
export const notesRouter = Router({ mergeParams: true });

const addNoteSchema = z.object({
  content: z.string().min(1),
  isDraft: z.boolean().optional(),
  isSuoMoto: z.boolean().optional(),
  references: z
    .object({
      correspondence: z.array(z.string()).optional(),
      notes: z.array(z.string()).optional(),
    })
    .optional(),
});

notesRouter.post('/', asyncHandler(async (req, res) => {
  const input = addNoteSchema.parse(req.body);
  const note = await addNote(req.params.id, input, req.user!);
  res.status(201).json({ note });
}));

notesRouter.post('/:noteId/submit', asyncHandler(async (req, res) => {
  const note = await submitNote(req.params.id, req.params.noteId, req.user!);
  res.json({ note });
}));

notesRouter.patch('/:noteId', asyncHandler(async (req, res) => {
  const input = z.object({ content: z.string().min(1) }).parse(req.body);
  const file = await updateNote(req.params.id, req.params.noteId, input, req.user!);
  res.json({ file });
}));
