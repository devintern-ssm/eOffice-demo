import type { Prisma } from '@prisma/client';
import { prisma } from '../../prisma.js';
import type { AuthUser } from '../../middleware/auth.js';

export interface ReportQuery {
  section?: string;
  from?: string;
  to?: string;
  search?: string;
}

/** Non-admins must not see confidential files' details in the global reports (SD §7). */
function seesConfidential(viewer?: AuthUser): boolean {
  return viewer?.role === 'ADMIN';
}

function dateRange(q: ReportQuery): Prisma.DateTimeFilter | undefined {
  const createdAt: Prisma.DateTimeFilter = {};
  if (q.from) { const d = new Date(q.from); if (!Number.isNaN(d.getTime())) createdAt.gte = d; }
  if (q.to) { const d = new Date(q.to); if (!Number.isNaN(d.getTime())) { d.setHours(23, 59, 59, 999); createdAt.lte = d; } }
  return Object.keys(createdAt).length ? createdAt : undefined;
}

function buildWhere(q: ReportQuery, viewer?: AuthUser): Prisma.MovementWhereInput {
  const where: Prisma.MovementWhereInput = {};
  const createdAt = dateRange(q);
  if (createdAt) where.createdAt = createdAt;
  const fileFilter: Prisma.FileWhereInput = {};
  if (q.section) fileFilter.section = q.section;
  if (!seesConfidential(viewer)) fileFilter.confidential = false;
  if (q.search) {
    fileFilter.OR = [
      { subject: { contains: q.search } },
      { displayNumber: { contains: q.search } },
    ];
  }
  if (Object.keys(fileFilter).length) where.file = fileFilter;
  return where;
}

/** All-files register with Submitted By + Department (review #5 — super-admin report). */
export async function getFilesRegister(q: ReportQuery, viewer?: AuthUser) {
  const where: Prisma.FileWhereInput = {};
  const createdAt = dateRange(q);
  if (createdAt) where.createdAt = createdAt;
  if (q.section) where.section = q.section;
  if (!seesConfidential(viewer)) where.confidential = false;
  if (q.search) {
    where.OR = [
      { subject: { contains: q.search } },
      { displayNumber: { contains: q.search } },
      { customFileNumber: { contains: q.search } },
    ];
  }

  const files = await prisma.file.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 1000,
    include: { createdBy: { select: { name: true } }, currentHolder: { select: { name: true } } },
  });

  return files.map((f) => ({
    id: f.id,
    fileNumber: f.displayNumber ?? f.customFileNumber ?? '(draft)',
    subject: f.subject,
    department: f.section,
    status: f.status,
    submittedBy: f.createdBy?.name ?? '',
    holder: f.currentHolder?.name ?? '',
    confidential: f.confidential,
    createdDate: f.createdAt,
  }));
}

export async function getReport(q: ReportQuery, viewer?: AuthUser) {
  const [movements, files] = await Promise.all([
    prisma.movement.findMany({
      where: buildWhere(q, viewer),
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: { file: { select: { id: true, displayNumber: true, subject: true, section: true } } },
    }),
    getFilesRegister(q, viewer),
  ]);

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

  return { rows, files, summary: { totalFiles, approved, underReview, closed, logCount: rows.length } };
}

function csvCell(v: unknown): string {
  let s = String(v ?? '');
  // Neutralize spreadsheet formula injection (leading = + - @ tab CR).
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function getReportCsv(q: ReportQuery, type: 'log' | 'files' = 'log', viewer?: AuthUser): Promise<string> {
  if (type === 'files') {
    const files = await getFilesRegister(q, viewer);
    const header = ['File Number', 'Subject', 'Department', 'Status', 'Submitted By', 'Current Holder', 'Created'];
    const lines = [header.join(',')];
    for (const f of files) {
      lines.push([f.fileNumber, f.subject, f.department, f.status, f.submittedBy, f.holder, new Date(f.createdDate).toISOString()].map(csvCell).join(','));
    }
    return lines.join('\n');
  }
  const { rows } = await getReport(q, viewer);
  const header = ['Date', 'File Number', 'Subject', 'Section', 'Action', 'Actor', 'To', 'Dept', 'Remarks'];
  const lines = [header.join(',')];
  for (const r of rows) {
    lines.push([new Date(r.date).toISOString(), r.fileNumber, r.subject, r.section, r.action, r.actor, r.to, r.dept, r.remarks].map(csvCell).join(','));
  }
  return lines.join('\n');
}
