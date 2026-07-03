import type { Prisma } from '@prisma/client';
import { prisma } from '../../prisma.js';

export interface ReportQuery {
  section?: string;
  from?: string;
  to?: string;
  search?: string;
}

function buildWhere(q: ReportQuery): Prisma.MovementWhereInput {
  const where: Prisma.MovementWhereInput = {};
  const createdAt: Prisma.DateTimeFilter = {};
  if (q.from) { const d = new Date(q.from); if (!Number.isNaN(d.getTime())) createdAt.gte = d; }
  if (q.to) { const d = new Date(q.to); if (!Number.isNaN(d.getTime())) { d.setHours(23, 59, 59, 999); createdAt.lte = d; } }
  if (Object.keys(createdAt).length) where.createdAt = createdAt;
  const fileFilter: Prisma.FileWhereInput = {};
  if (q.section) fileFilter.section = q.section;
  if (q.search) {
    fileFilter.OR = [
      { subject: { contains: q.search } },
      { displayNumber: { contains: q.search } },
    ];
  }
  if (Object.keys(fileFilter).length) where.file = fileFilter;
  return where;
}

export async function getReport(q: ReportQuery) {
  const movements = await prisma.movement.findMany({
    where: buildWhere(q),
    orderBy: { createdAt: 'desc' },
    take: 500,
    include: { file: { select: { id: true, displayNumber: true, subject: true, section: true } } },
  });

  const rows = movements.map((m) => ({
    id: m.id,
    date: m.createdAt,
    fileId: m.fileId,
    fileNumber: m.file?.displayNumber ?? '(draft)',
    subject: m.file?.subject ?? '',
    section: m.file?.section ?? '',
    action: m.type,
    actor: m.actorName,
    to: m.toName ?? '',
    dept: m.dept ?? '',
    remarks: m.remarks ?? '',
  }));

  // Summary cards
  const [totalFiles, approved, underReview, closed] = await Promise.all([
    prisma.file.count(),
    prisma.file.count({ where: { status: 'APPROVED' } }),
    prisma.file.count({ where: { status: 'UNDER_REVIEW' } }),
    prisma.file.count({ where: { status: 'CLOSED' } }),
  ]);

  return { rows, summary: { totalFiles, approved, underReview, closed, logCount: rows.length } };
}

function csvCell(v: unknown): string {
  let s = String(v ?? '');
  // Neutralize spreadsheet formula injection (leading = + - @ tab CR).
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function getReportCsv(q: ReportQuery): Promise<string> {
  const { rows } = await getReport(q);
  const header = ['Date', 'File Number', 'Subject', 'Section', 'Action', 'Actor', 'To', 'Dept', 'Remarks'];
  const lines = [header.join(',')];
  for (const r of rows) {
    lines.push([new Date(r.date).toISOString(), r.fileNumber, r.subject, r.section, r.action, r.actor, r.to, r.dept, r.remarks].map(csvCell).join(','));
  }
  return lines.join('\n');
}
