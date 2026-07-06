import { Router } from 'express';
import { asyncHandler, ApiError } from '../../utils/http.js';
import { renderPrint } from './print.service.js';

export const printRouter = Router({ mergeParams: true });

printRouter.get('/print', asyncHandler(async (req, res) => {
  // Print renders Noting/Correspondence content — off-limits to the admin (oversight) role (#4).
  if (req.user?.role === 'ADMIN') throw ApiError.forbidden('Admins do not have access to the Noting and Correspondence modules');
  const side = req.query.side === 'correspondence' ? 'correspondence' : 'noting';
  const html = await renderPrint(req.params.id, side);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
}));
