import { Router } from 'express';
import { asyncHandler } from '../../utils/http.js';
import { renderPrint } from './print.service.js';

export const printRouter = Router({ mergeParams: true });

printRouter.get('/print', asyncHandler(async (req, res) => {
  const side = req.query.side === 'correspondence' ? 'correspondence' : 'noting';
  const html = await renderPrint(req.params.id, side);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
}));
