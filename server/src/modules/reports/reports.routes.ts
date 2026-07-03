import { Router } from 'express';
import { asyncHandler } from '../../utils/http.js';
import { authenticate } from '../../middleware/auth.js';
import { getReport, getReportCsv } from './reports.service.js';

export const reportsRouter = Router();

reportsRouter.use(authenticate);

function query(req: any) {
  return {
    section: req.query.section as string | undefined,
    from: req.query.from as string | undefined,
    to: req.query.to as string | undefined,
    search: req.query.search as string | undefined,
  };
}

reportsRouter.get('/', asyncHandler(async (req, res) => {
  res.json(await getReport(query(req)));
}));

reportsRouter.get('/export', asyncHandler(async (req, res) => {
  const csv = await getReportCsv(query(req));
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="eoffice-report.csv"');
  res.send(csv);
}));
