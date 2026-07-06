import type { Prisma } from '@prisma/client';
import { prisma } from '../../prisma.js';
import { ApiError } from '../../utils/http.js';
import type { AuthUser } from '../../middleware/auth.js';
import { allocateFileNumber } from '../../services/numbering.js';

type FileWithCreator = Prisma.FileGetPayload<{ include: { createdBy: true; currentHolder: true } }>;

/** Inbox classification (D7): Outward = reverted to you for rework; otherwise Inward. */
function inboxStateFor(status: string): 'Inward' | 'Outward' {
  return status === 'REVERTED' ? 'Outward' : 'Inward';
}

/** Map a File row to the DTO the frontend list screens consume. */
export function toFileDTO(f: FileWithCreator) {
  return {
    id: f.id,
    fileNumber: f.displayNumber ?? f.customFileNumber ?? 'DRAFT',
    unNumber: f.displayNumber ?? '',
    displayNumber: f.displayNumber,
    customFileNumber: f.customFileNumber,
    subject: f.subject,
    section: f.section,
    status: f.status,
    priority: f.priority,
    confidential: f.confidential,
    inboxType: inboxStateFor(f.status),
    createdDate: f.createdAt,
    lastModified: f.lastUsedAt,
    lastUsedDate: f.lastUsedAt,
    startPeriod: f.startPeriod,
    endPeriod: f.endPeriod,
    createdBy: f.createdById,
    createdByName: f.createdBy?.name ?? null,
    currentAssignee: f.currentHolderId,
    currentHolderName: f.currentHolder?.name ?? null,
  };
}

export interface ListFilesQuery {
  section?: string;
  un?: string;        // exact displayNumber
  status?: string;
  search?: string;    // subject / number contains
  mine?: boolean;     // created by me
  holder?: boolean;   // I currently hold it (inbox)
  pending?: boolean;  // a PENDING step is assigned to me (my approval queue)
  sent?: boolean;     // I created it and it has been forwarded at least once
  draft?: boolean;    // my DRAFT files or files where I have a draft note (review #8)
}

export async function listFiles(q: ListFilesQuery, user: AuthUser) {
  const and: Prisma.FileWhereInput[] = [];
  if (q.section) and.push({ section: q.section });
  if (q.status) and.push({ status: q.status });
  if (q.un) and.push({ displayNumber: q.un });
  if (q.mine) and.push({ createdById: user.id });
  if (q.holder) and.push({ currentHolderId: user.id });
  if (q.pending) and.push({ steps: { some: { status: 'PENDING', assigneeId: user.id } } });
  if (q.sent) and.push({ createdById: user.id, movements: { some: { type: 'FORWARD' } } });
  if (q.draft) and.push({
    OR: [
      { status: 'DRAFT', createdById: user.id },
      { notes: { some: { status: 'DRAFT', authorId: user.id } } },
    ],
  });
  if (q.search) {
    and.push({
      OR: [
        { subject: { contains: q.search } },
        { displayNumber: { contains: q.search } },
        { customFileNumber: { contains: q.search } },
      ],
    });
  }
  // NOTE: full confidential-file gating (restricted view) lands in slice 1.10.

  const files = await prisma.file.findMany({
    where: and.length ? { AND: and } : {},
    include: { createdBy: true, currentHolder: true, steps: { select: { assigneeId: true } } },
    orderBy: { lastUsedAt: 'desc' },
  });
  // Confidential files are visible only to involved parties (S7 / SD §7).
  const visible = files.filter(
    (f) => !f.confidential || user.role === 'ADMIN' || f.createdById === user.id
      || f.currentHolderId === user.id || f.steps.some((s) => s.assigneeId === user.id),
  );
  return visible.map(toFileDTO);
}

/** Throw 403 if the user may not view a confidential file (S7 / SD §7). */
export async function assertCanAccessFile(fileId: string, user: AuthUser) {
  const f = await prisma.file.findUnique({ where: { id: fileId }, include: { steps: { select: { assigneeId: true } } } });
  if (!f) throw ApiError.notFound('File not found');
  if (!f.confidential) return;
  const allowed = user.role === 'ADMIN' || f.createdById === user.id || f.currentHolderId === user.id
    || f.steps.some((s) => s.assigneeId === user.id);
  if (!allowed) throw ApiError.forbidden('This file is confidential');
}

/** KPI counts + recent activity for the Dashboard. */
export async function getFileStats(user: AuthUser) {
  const [filesCreated, pendingMyAction, awaitingApproval, inboxCount, recentMovements] =
    await Promise.all([
      prisma.file.count({ where: { createdById: user.id } }),
      prisma.file.count({ where: { steps: { some: { status: 'PENDING', assigneeId: user.id } } } }),
      prisma.file.count({ where: { createdById: user.id, status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } } }),
      prisma.file.count({ where: { currentHolderId: user.id } }),
      prisma.movement.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: { file: { select: { id: true, subject: true, displayNumber: true } } },
      }),
    ]);

  return {
    stats: { filesCreated, pendingMyAction, awaitingApproval, inboxCount },
    recentActivity: recentMovements.map((m) => ({
      id: m.id,
      type: m.type,
      actorName: m.actorName,
      remarks: m.remarks,
      date: m.createdAt,
      fileId: m.fileId,
      fileNumber: m.file?.displayNumber ?? '(draft)',
      fileSubject: m.file?.subject ?? '',
    })),
  };
}

/** Full file detail (cover + notes + correspondence + movements + steps) for FileDetail.
 *  Pass the viewing user so ADMIN (super admin) is denied the Noting/Correspondence
 *  content per review #4 — they retain cover, movement history and the approval flow. */
export async function getFileDetail(id: string, viewer?: AuthUser) {
  const f = await prisma.file.findUnique({
    where: { id },
    include: {
      createdBy: true,
      currentHolder: true,
      notes: {
        orderBy: { noteNumber: 'asc' },
        include: { author: true, references: true, paragraphApprovals: true, checkerComments: true },
      },
      correspondence: { orderBy: { createdAt: 'asc' } },
      movements: { orderBy: { createdAt: 'asc' } },
      steps: { orderBy: { stepOrder: 'asc' } },
    },
  });
  if (!f) throw ApiError.notFound('File not found');

  const contentRestricted = viewer?.role === 'ADMIN';

  // Continuous page numbering across correspondence PDFs (review #7): each attachment
  // occupies a running page range; email references (no pages) are skipped.
  let runningPage = 0;
  const correspondence = f.correspondence.map((c) => {
    const pages = c.pageCount ?? 0;
    const startPage = pages > 0 ? runningPage + 1 : null;
    runningPage += pages;
    const endPage = pages > 0 ? runningPage : null;
    return {
      id: c.id,
      number: c.number,
      type: c.type,
      title: c.title,
      inwardDate: c.inwardDate,
      inwardNumber: c.inwardNumber,
      storageKey: c.storageKey,
      mime: c.mime,
      originalName: c.originalName,
      pageCount: c.pageCount,
      startPage,
      endPage,
    };
  });

  return {
    ...toFileDTO(f),
    contentRestricted,
    notes: contentRestricted ? [] : f.notes.map((n) => ({
      id: n.id,
      noteNumber: n.noteNumber,
      content: n.content,
      date: n.createdAt,
      status: n.status,
      isSuoMoto: n.isSuoMoto,
      author: {
        id: n.authorId,
        name: n.authorName,
        designation: n.author?.designation ?? '',
        role: n.authorRole,
      },
      references: {
        correspondence: n.references.filter((r) => r.targetType === 'CORRESPONDENCE').map((r) => r.targetRef),
        notes: n.references.filter((r) => r.targetType === 'NOTE').map((r) => r.targetRef),
      },
      approvals: n.paragraphApprovals.map((p) => ({
        paragraph: p.paragraphMark,
        status: p.status,
        assignedTo: p.assignedToName,
        approvedBy: p.approvedByName,
        date: p.approvedAt,
      })),
      checkerComments: n.checkerComments.map((c) => ({ checkerName: c.authorName, comment: c.comment, action: c.action, date: c.createdAt })),
    })),
    correspondence: contentRestricted ? [] : correspondence,
    movements: f.movements.map((m) => ({
      id: m.id,
      action: m.type,
      from: { name: m.fromName ?? m.actorName, section: m.fromSection ?? '' },
      to: { name: m.toName ?? '', section: m.toSection ?? '' },
      date: m.createdAt,
      remarks: m.remarks ?? '',
    })),
    steps: f.steps.map((s) => ({
      id: s.id,
      stepOrder: s.stepOrder,
      assigneeName: s.assigneeName,
      roleAtStep: s.roleAtStep,
      status: s.status,
      remarks: s.remarks,
      dept: s.dept,
      signatureName: s.signatureName,
      actedAt: s.actedAt,
    })),
  };
}

/** Cover-only DTO (used by create/submit responses). */
async function getFileCover(id: string) {
  const file = await prisma.file.findUnique({
    where: { id },
    include: { createdBy: true, currentHolder: true },
  });
  if (!file) throw ApiError.notFound('File not found');
  return toFileDTO(file);
}

export interface CreateFileInput {
  subject: string;
  section: string;
  confidential?: boolean;
  priority?: string;
  customFileNumber?: string;
  startPeriod?: string | null;
  initialNote?: string;
}

export async function createFile(input: CreateFileInput, user: AuthUser) {
  const file = await prisma.$transaction(async (tx) => {
    const created = await tx.file.create({
      data: {
        subject: input.subject,
        section: input.section,
        confidential: input.confidential ?? false,
        priority: input.priority ?? 'Normal',
        customFileNumber: input.customFileNumber || null,
        startPeriod: input.startPeriod ? new Date(input.startPeriod) : null,
        status: 'DRAFT',
        createdById: user.id,
        currentHolderId: user.id, // originator holds the file initially (H6)
      },
    });

    if (input.initialNote && input.initialNote.trim()) {
      await tx.note.create({
        data: {
          fileId: created.id,
          noteNumber: 1,
          content: input.initialNote.trim(),
          authorId: user.id,
          authorName: user.name,
          authorRole: user.role,
          status: 'DRAFT',
        },
      });
    }

    await tx.movement.create({
      data: {
        fileId: created.id,
        type: 'CREATE',
        actorId: user.id,
        actorName: user.name,
        fromSection: user.section,
        remarks: 'File opened',
      },
    });

    return created;
  });

  return getFileCover(file.id);
}

/**
 * Submit a DRAFT file: assign its DEPT/YEAR/SEQ number (D1) and move to SUBMITTED.
 * (Full routing into workflow steps arrives in slice 1.3.)
 */
export async function submitFile(id: string, user: AuthUser) {
  const file = await prisma.file.findUnique({ where: { id } });
  if (!file) throw ApiError.notFound('File not found');
  if (file.createdById !== user.id) throw ApiError.forbidden('Only the originator can submit this file');
  if (file.status !== 'DRAFT') throw ApiError.badRequest('Only a DRAFT file can be submitted');

  const year = new Date(file.createdAt).getFullYear();
  const displayNumber = file.displayNumber ?? (await allocateFileNumber(file.section, year));

  await prisma.$transaction([
    prisma.file.update({
      where: { id },
      data: { displayNumber, status: 'SUBMITTED', lastUsedAt: new Date() },
    }),
    prisma.movement.create({
      data: {
        fileId: id,
        type: 'SUBMIT',
        actorId: user.id,
        actorName: user.name,
        remarks: `Submitted; number ${displayNumber} assigned`,
      },
    }),
  ]);

  return getFileCover(id);
}
