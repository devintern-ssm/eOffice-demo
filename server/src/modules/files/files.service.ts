import type { Prisma } from '@prisma/client';
import { prisma } from '../../prisma.js';
import { ApiError } from '../../utils/http.js';
import type { AuthUser } from '../../middleware/auth.js';
import { allocateFileNumber } from '../../services/numbering.js';
import { computeCorrespondencePaging, paginateNotes } from '../../utils/paging.js';

type FileWithCreator = Prisma.FileGetPayload<{ include: { createdBy: true; currentHolder: true } }>;

/** Map a File row to the DTO the frontend list screens consume. */
export function toFileDTO(f: FileWithCreator) {
  return {
    id: f.id,
    fileNumber: f.displayNumber ?? f.customFileNumber ?? '(unnumbered)',
    unNumber: f.displayNumber ?? '',
    displayNumber: f.displayNumber,
    customFileNumber: f.customFileNumber,
    subject: f.subject,
    section: f.section,
    status: f.status, // OPEN | CLOSED
    priority: f.priority,
    confidential: f.confidential,
    inboxType: 'Inward' as const,
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
  status?: string;    // OPEN | CLOSED
  search?: string;    // subject / number contains
  mine?: boolean;     // created by me
  holder?: boolean;   // I currently hold it (inbox)
  pending?: boolean;  // a note in this file awaits MY signature
  sent?: boolean;     // I created it and a note has been put up for review
  draft?: boolean;    // I have a DRAFT note in this file
}

export async function listFiles(q: ListFilesQuery, user: AuthUser) {
  const and: Prisma.FileWhereInput[] = [];
  if (q.section) and.push({ section: q.section });
  if (q.status) and.push({ status: q.status });
  if (q.un) and.push({ displayNumber: q.un });
  if (q.mine) and.push({ createdById: user.id });
  if (q.holder) and.push({ currentHolderId: user.id });
  if (q.pending) and.push({ noteSteps: { some: { status: 'PENDING', signerId: user.id } } });
  if (q.sent) and.push({ createdById: user.id, movements: { some: { type: 'SUBMIT_NOTE' } } });
  if (q.draft) and.push({ notes: { some: { status: 'DRAFT', authorId: user.id } } });
  if (q.search) {
    and.push({
      OR: [
        { subject: { contains: q.search } },
        { displayNumber: { contains: q.search } },
        { customFileNumber: { contains: q.search } },
      ],
    });
  }

  const files = await prisma.file.findMany({
    where: and.length ? { AND: and } : {},
    include: {
      createdBy: true,
      currentHolder: true,
      noteSteps: { select: { signerId: true } },
      notes: { where: { status: { in: ['IN_REVIEW', 'RETURNED'] } }, select: { noteNumber: true, status: true }, take: 1 },
    },
    orderBy: { lastUsedAt: 'desc' },
  });
  // Confidential files are visible only to involved parties.
  const visible = files.filter(
    (f) => !f.confidential || user.role === 'ADMIN' || f.createdById === user.id
      || f.currentHolderId === user.id || f.noteSteps.some((s) => s.signerId === user.id),
  );
  // Expose whether a note is in flight (so callers can offer "add a note" only on idle binders),
  // and classify the inbox bucket for the viewer: a note RETURNED to me for rework is "Outward"
  // (it went out and came back); everything else received/held is "Inward".
  return visible.map((f) => {
    const active = f.notes[0] ?? null;
    const inboxType: 'Inward' | 'Outward' = active?.status === 'RETURNED' && f.currentHolderId === user.id ? 'Outward' : 'Inward';
    return { ...toFileDTO(f), inboxType, activeNoteNumber: active?.noteNumber ?? null, activeNoteStatus: active?.status ?? null };
  });
}

/** Throw 403 if the user may not view a confidential file. */
export async function assertCanAccessFile(fileId: string, user: AuthUser) {
  const f = await prisma.file.findUnique({ where: { id: fileId }, include: { noteSteps: { select: { signerId: true } } } });
  if (!f) throw ApiError.notFound('File not found');
  if (!f.confidential) return;
  const allowed = user.role === 'ADMIN' || f.createdById === user.id || f.currentHolderId === user.id
    || f.noteSteps.some((s) => s.signerId === user.id);
  if (!allowed) throw ApiError.forbidden('This file is confidential');
}

function mapRecent(movements: Array<{ id: string; type: string; actorName: string; remarks: string | null; createdAt: Date; fileId: string; file: { subject: string; displayNumber: string | null } | null }>) {
  return movements.map((m) => ({
    id: m.id, type: m.type, actorName: m.actorName, remarks: m.remarks, date: m.createdAt,
    fileId: m.fileId, fileNumber: m.file?.displayNumber ?? '(unnumbered)', fileSubject: m.file?.subject ?? '',
  }));
}

/** KPI counts + recent activity for the Dashboard. Admin gets a system-wide (super-admin) view. */
export async function getFileStats(user: AuthUser) {
  if (user.role === 'ADMIN') {
    const [totalFiles, openFiles, closedFiles, notesInReview, recentMovements] = await Promise.all([
      prisma.file.count(),
      prisma.file.count({ where: { status: 'OPEN' } }),
      prisma.file.count({ where: { status: 'CLOSED' } }),
      prisma.note.count({ where: { status: 'IN_REVIEW' } }),
      prisma.movement.findMany({ orderBy: { createdAt: 'desc' }, take: 8, include: { file: { select: { id: true, subject: true, displayNumber: true } } } }),
    ]);
    return { isAdmin: true, stats: { totalFiles, openFiles, closedFiles, notesInReview }, recentActivity: mapRecent(recentMovements) };
  }

  const [filesCreated, pendingMyAction, inboxCount, notesInReview, recentMovements] =
    await Promise.all([
      prisma.file.count({ where: { createdById: user.id } }),
      prisma.file.count({ where: { noteSteps: { some: { status: 'PENDING', signerId: user.id } } } }),
      prisma.file.count({ where: { currentHolderId: user.id } }),
      prisma.note.count({ where: { authorId: user.id, status: 'IN_REVIEW' } }),
      prisma.movement.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: { file: { select: { id: true, subject: true, displayNumber: true } } },
      }),
    ]);

  return {
    isAdmin: false,
    stats: { filesCreated, pendingMyAction, inboxCount, notesInReview },
    recentActivity: mapRecent(recentMovements),
  };
}

/** Full file detail (binder cover + notes w/ their own signer chains + correspondence + movements). */
export async function getFileDetail(id: string, viewer?: AuthUser) {
  const f = await prisma.file.findUnique({
    where: { id },
    include: {
      createdBy: true,
      currentHolder: true,
      notes: {
        orderBy: { noteNumber: 'asc' },
        include: {
          author: true,
          references: true,
          paragraphApprovals: true,
          checkerComments: true,
          steps: { orderBy: { stepOrder: 'asc' } },
        },
      },
      correspondence: { orderBy: [{ seq: 'asc' }, { createdAt: 'asc' }] },
      movements: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!f) throw ApiError.notFound('File not found');

  const contentRestricted = viewer?.role === 'ADMIN';

  // Page-level C-numbers across correspondence attachments.
  const corrPaging = computeCorrespondencePaging(f.correspondence);
  const correspondence = f.correspondence.map((c) => {
    const pg = corrPaging.get(c.id)!;
    const label = pg.firstC == null ? '—'
      : pg.firstC === pg.lastC ? `C${pg.firstC}` : `C${pg.firstC}–C${pg.lastC}`;
    return {
      id: c.id,
      number: c.number,           // internal attachment index label
      cLabel: label,              // display: "C1–C20"
      firstC: pg.firstC,
      lastC: pg.lastC,
      cPages: pg.pages,           // [C1, C2, …] for the expandable page list
      type: c.type,
      title: c.title,
      inwardDate: c.inwardDate,
      inwardNumber: c.inwardNumber,
      storageKey: c.storageKey,
      mime: c.mime,
      originalName: c.originalName,
      pageCount: c.pageCount,
    };
  });

  // Continuous noting-side page spans (finalized/in-review notes; drafts excluded).
  const notePaging = paginateNotes(f.notes);

  const mapStep = (s: any) => ({
    id: s.id,
    stepOrder: s.stepOrder,
    signerId: s.signerId,
    signerName: s.signerName,
    roleLabel: s.roleLabel,
    status: s.status,             // PENDING | SIGNED | RETURNED
    remarks: s.remarks,
    dept: s.dept,
    signatureName: s.signatureName,
    actedAt: s.actedAt,
  });

  const visibleNotes = f.notes.filter((n) => n.status !== 'DRAFT' || n.authorId === viewer?.id);
  const activeNote = f.notes.find((n) => n.status === 'IN_REVIEW' || n.status === 'RETURNED') ?? null;

  return {
    ...toFileDTO(f),
    contentRestricted,
    activeNoteNumber: activeNote?.noteNumber ?? null,
    activeNoteStatus: activeNote?.status ?? null,
    notes: contentRestricted ? [] : visibleNotes.map((n) => {
      const np = notePaging.get(n.id);
      return {
        id: n.id,
        noteNumber: n.noteNumber,
        content: n.content,
        date: n.createdAt,
        submittedAt: n.submittedAt,
        finalizedAt: n.finalizedAt,
        status: n.status,          // DRAFT | IN_REVIEW | RETURNED | FINALIZED
        isSuoMoto: n.isSuoMoto,
        startPage: np?.startPage ?? null,
        endPage: np?.endPage ?? null,
        pageCount: np?.pageCount ?? null,
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
        steps: n.steps.map(mapStep),
        approvals: n.paragraphApprovals.map((p) => ({
          paragraph: p.paragraphMark,
          role: p.role,
          status: p.status,
          assignedTo: p.assignedToName,
          approvedBy: p.approvedByName,
          date: p.approvedAt,
        })),
        checkerComments: n.checkerComments.map((c) => ({ checkerName: c.authorName, comment: c.comment, action: c.action, date: c.createdAt })),
      };
    }),
    correspondence: contentRestricted ? [] : correspondence,
    // Top-level "approval flow" = the currently in-flight note's chain (for the side panel).
    steps: contentRestricted || !activeNote ? [] : activeNote.steps.map(mapStep),
    movements: f.movements.map((m) => ({
      id: m.id,
      action: m.type,
      noteNumber: m.noteNumber,
      from: { name: m.fromName ?? m.actorName, section: m.fromSection ?? '' },
      to: { name: m.toName ?? '', section: m.toSection ?? '' },
      date: m.createdAt,
      remarks: m.remarks ?? '',
    })),
  };
}

/** Cover-only DTO (used by create responses). */
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

/** Open a new binder. The UN number is assigned immediately; the creator holds it. */
export async function createFile(input: CreateFileInput, user: AuthUser) {
  const year = new Date().getFullYear();
  const displayNumber = await allocateFileNumber(input.section, year);

  const file = await prisma.$transaction(async (tx) => {
    const created = await tx.file.create({
      data: {
        displayNumber,
        subject: input.subject,
        section: input.section,
        confidential: input.confidential ?? false,
        priority: input.priority ?? 'Normal',
        customFileNumber: input.customFileNumber || null,
        startPeriod: input.startPeriod ? new Date(input.startPeriod) : null,
        status: 'OPEN',
        createdById: user.id,
        currentHolderId: user.id, // originator holds the binder initially
      },
    });

    // The opening note starts as the maker's DRAFT — they add signers and put it up for review.
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
        remarks: `Binder opened; UN ${displayNumber} assigned`,
      },
    });

    return created;
  });

  return getFileCover(file.id);
}
