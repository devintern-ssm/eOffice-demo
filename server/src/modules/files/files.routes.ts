import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ApiError } from '../../utils/http.js';
import { authenticate } from '../../middleware/auth.js';
import {
  assertCanAccessFile, createFile, getFileDetail, getFileStats, listFiles,
} from './files.service.js';
import { notesRouter } from '../notes/notes.routes.js';
import { correspondenceRouter } from '../correspondence/correspondence.routes.js';
import { workflowRouter } from '../workflow/workflow.routes.js';
import { lifecycleRouter } from '../lifecycle/lifecycle.routes.js';
import { approvalsRouter } from '../approvals/approvals.routes.js';
import { printRouter } from '../print/print.routes.js';

export const filesRouter = Router();

filesRouter.use(authenticate);

const createSchema = z.object({
  // .trim() before .min(1) so a whitespace-only subject/section is rejected, not stored blank (QA BUG-1).
  subject: z.string().trim().min(1),
  section: z.string().trim().min(1), // any admin-managed department (observation #1)
  confidential: z.boolean().optional(),
  priority: z.enum(['Normal', 'High', 'Urgent']).optional(),
  customFileNumber: z.string().optional(),
  startPeriod: z.string().nullable().optional(),
  initialNote: z.string().optional(),
});

// --- Collection routes FIRST, so the "/:id" mounts below don't shadow "/stats" ---
filesRouter.get('/', asyncHandler(async (req, res) => {
  const files = await listFiles(
    {
      section: req.query.section as string | undefined,
      un: req.query.un as string | undefined,
      status: req.query.status as string | undefined,
      search: req.query.search as string | undefined,
      mine: req.query.mine === 'true',
      holder: req.query.holder === 'true',
      pending: req.query.pending === 'true',
      sent: req.query.sent === 'true',
      draft: req.query.draft === 'true',
    },
    req.user!,
  );
  res.json({ files });
}));

filesRouter.get('/stats', asyncHandler(async (req, res) => {
  const data = await getFileStats(req.user!);
  res.json(data);
}));

filesRouter.post('/', asyncHandler(async (req, res) => {
  const input = createSchema.parse(req.body);
  const file = await createFile(input, req.user!);
  res.status(201).json({ file });
}));

// --- Confidential access gate applied to EVERY file-scoped ("/:id/...") route ---
const requireFileAccess = asyncHandler(async (req, _res, next) => {
  await assertCanAccessFile(req.params.id, req.user!);
  next();
});

// The (super) ADMIN is an oversight role: reports, users and file metadata — but NOT the
// Noting/Correspondence content (review #4). Block admins from those modules & their prints.
const blockAdminContent = (req: any, _res: any, next: any) => {
  if (req.user?.role === 'ADMIN') {
    throw ApiError.forbidden('Admins do not have access to the Noting and Correspondence modules');
  }
  next();
};

filesRouter.use('/:id/notes', requireFileAccess, blockAdminContent, notesRouter);
filesRouter.use('/:id/correspondence', requireFileAccess, blockAdminContent, correspondenceRouter);
filesRouter.use('/:id', requireFileAccess, workflowRouter);   // /:id/sign, /:id/return, /:id/signers
filesRouter.use('/:id', requireFileAccess, lifecycleRouter);  // /:id/handover, /:id/transfer, /:id/close
// NOTE: blockAdminContent must NOT be attached to this base-path mount — a use('/:id') mount also
// matches GET /:id and would 403 the admin's own file-detail view. The approvals ROUTES gate the
// admin individually (they touch Noting/Correspondence content).
filesRouter.use('/:id', requireFileAccess, approvalsRouter);  // /:id/md-approval, /:id/notes/:noteId/comments
filesRouter.use('/:id', requireFileAccess, printRouter);      // /:id/print (admin guarded inside)

filesRouter.get('/:id', requireFileAccess, asyncHandler(async (req, res) => {
  const file = await getFileDetail(req.params.id, req.user!);
  res.json({ file });
}));
