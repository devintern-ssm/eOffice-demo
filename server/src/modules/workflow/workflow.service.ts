import type { User } from '@prisma/client';
import { prisma } from '../../prisma.js';
import { ApiError } from '../../utils/http.js';
import type { AuthUser } from '../../middleware/auth.js';
import { allocateFileNumber } from '../../services/numbering.js';
import { getFileDetail } from '../files/files.service.js';
import { STEP_ROLES } from '../../utils/domain.js';

function roleForStep(requested: string | undefined, userRole: string): string {
  if (requested && (STEP_ROLES as readonly string[]).includes(requested)) return requested;
  if ((STEP_ROLES as readonly string[]).includes(userRole)) return userRole;
  return 'CHECKER';
}

interface Recipient { userId: string; role?: string }

/**
 * Forward / route a file from the originator into the review chain (C5/C6).
 * Works from DRAFT (plan + submit: assigns number) or REVERTED (resubmit after correction).
 * Reverted steps are reset to PENDING; any new recipients are appended in order.
 */
export async function forwardFile(fileId: string, input: { recipients: Recipient[]; remarks?: string }, user: AuthUser) {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) throw ApiError.notFound('File not found');
  if (!(file.createdById === user.id || file.currentHolderId === user.id || user.role === 'ADMIN')) {
    throw ApiError.forbidden('Only the originator/holder can forward this file');
  }
  if (!['DRAFT', 'SUBMITTED', 'REVERTED'].includes(file.status)) {
    throw ApiError.badRequest('File is already in review or closed');
  }

  // Validate recipients BEFORE allocating a number, so a bad recipient doesn't burn a
  // sequence number (allocateFileNumber commits in its own transaction).
  const recipientUsers: { user: User; role?: string }[] = [];
  for (const r of input.recipients ?? []) {
    const u = await prisma.user.findUnique({ where: { id: r.userId } });
    if (!u) throw ApiError.badRequest(`Recipient not found: ${r.userId}`);
    recipientUsers.push({ user: u, role: r.role });
  }

  // Allocate the number BEFORE the transaction — allocateFileNumber runs its own
  // transaction, and SQLite can't nest interactive transactions (would deadlock).
  const displayNumber = file.displayNumber
    ?? (await allocateFileNumber(file.section, new Date(file.createdAt).getFullYear()));

  await prisma.$transaction(async (tx) => {
    // Resubmit: reactivate reverted steps.
    await tx.workflowStep.updateMany({ where: { fileId, status: 'REVERTED' }, data: { status: 'PENDING' } });

    // Append any newly named recipients after the existing steps.
    const agg = await tx.workflowStep.aggregate({ where: { fileId }, _max: { stepOrder: true } });
    let order = agg._max.stepOrder ?? 0;
    for (const { user: u, role } of recipientUsers) {
      order += 1;
      await tx.workflowStep.create({
        data: {
          fileId, stepOrder: order, assigneeId: u.id, assigneeName: u.name,
          roleAtStep: roleForStep(role, u.role), status: 'PENDING',
        },
      });
    }

    const steps = await tx.workflowStep.findMany({ where: { fileId }, orderBy: { stepOrder: 'asc' } });
    const firstPending = steps.find((s) => s.status === 'PENDING');
    if (!firstPending) throw ApiError.badRequest('Add at least one recipient before forwarding');

    await tx.file.update({
      where: { id: fileId },
      data: { displayNumber, status: 'UNDER_REVIEW', currentHolderId: firstPending.assigneeId, lastUsedAt: new Date() },
    });
    await tx.movement.create({
      data: {
        fileId, type: file.status === 'REVERTED' ? 'FORWARD' : 'SUBMIT',
        actorId: user.id, actorName: user.name,
        toUserId: firstPending.assigneeId, toName: firstPending.assigneeName,
        remarks: input.remarks || (file.status === 'REVERTED' ? 'Resubmitted after correction' : `Forwarded for review; number ${displayNumber} assigned`),
      },
    });
  });

  return getFileDetail(fileId);
}

/** Add a reviewer/recipient to the chain mid-flow (H13/C5). Appended as PENDING. */
export async function addReviewer(fileId: string, input: { userId: string; role?: string }, user: AuthUser) {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) throw ApiError.notFound('File not found');
  if (!(file.currentHolderId === user.id || file.createdById === user.id || user.role === 'ADMIN')) {
    throw ApiError.forbidden('Only the current holder can add a reviewer');
  }
  if (file.status === 'CLOSED' || file.status === 'APPROVED') throw ApiError.badRequest('File is not in review');

  await prisma.$transaction(async (tx) => {
    const u = await tx.user.findUnique({ where: { id: input.userId } });
    if (!u) throw ApiError.badRequest('User not found');
    const agg = await tx.workflowStep.aggregate({ where: { fileId }, _max: { stepOrder: true } });
    const order = (agg._max.stepOrder ?? 0) + 1;
    await tx.workflowStep.create({
      data: { fileId, stepOrder: order, assigneeId: u.id, assigneeName: u.name, roleAtStep: roleForStep(input.role, u.role), status: 'PENDING' },
    });
    await tx.movement.create({
      data: { fileId, type: 'FORWARD', actorId: user.id, actorName: user.name, toUserId: u.id, toName: u.name, remarks: `Added ${u.name} to the review chain` },
    });
    // Re-establish the single-holder invariant if the file was between reviewers (e.g. a
    // lone checker checked with no approver, so the holder was handed back to the originator).
    const pending = await tx.workflowStep.findMany({ where: { fileId, status: 'PENDING' }, orderBy: { stepOrder: 'asc' } });
    const first = pending[0];
    if (file.status === 'UNDER_REVIEW' && first && file.currentHolderId !== first.assigneeId) {
      await tx.file.update({ where: { id: fileId }, data: { currentHolderId: first.assigneeId, lastUsedAt: new Date() } });
    } else {
      await tx.file.update({ where: { id: fileId }, data: { lastUsedAt: new Date() } });
    }
  });

  return getFileDetail(fileId);
}

/** Remove a PENDING reviewer step that is not the current active one. */
export async function removeStep(fileId: string, stepId: string, user: AuthUser) {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) throw ApiError.notFound('File not found');
  if (!(file.currentHolderId === user.id || file.createdById === user.id || user.role === 'ADMIN')) {
    throw ApiError.forbidden('Not allowed to modify the chain');
  }
  const steps = await prisma.workflowStep.findMany({ where: { fileId }, orderBy: { stepOrder: 'asc' } });
  const step = steps.find((s) => s.id === stepId);
  if (!step) throw ApiError.notFound('Step not found');
  if (step.status !== 'PENDING') throw ApiError.badRequest('Only a pending step can be removed');
  // Protect the ACTIVE (first pending) step, regardless of currentHolderId (which can be stale).
  const firstPending = steps.find((s) => s.status === 'PENDING');
  if (firstPending && firstPending.id === step.id) throw ApiError.badRequest('Cannot remove the step currently in progress');

  await prisma.workflowStep.delete({ where: { id: stepId } });
  return getFileDetail(fileId);
}

/**
 * Act on the current review step (S6c + variants). Records date/time + dept + signature (H5/A2),
 * writes a note on the noting side for the remark, and transitions the file.
 */
export async function actOnFile(
  fileId: string,
  input: { action: 'check' | 'approve' | 'revert' | 'reject' | 'clarify'; remarks?: string; dept?: string; signatureName?: string; paragraphs?: string[] },
  user: AuthUser,
) {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) throw ApiError.notFound('File not found');
  if (file.status !== 'UNDER_REVIEW') throw ApiError.badRequest('File is not under review');

  const steps = await prisma.workflowStep.findMany({ where: { fileId }, orderBy: { stepOrder: 'asc' } });
  const current = steps.find((s) => s.status === 'PENDING');
  if (!current) throw ApiError.badRequest('No pending step to act on');
  // The acting user must be BOTH the current pending step's assignee AND the file holder
  // (the single-holder lock is the source of truth), unless they are an admin.
  if (!((current.assigneeId === user.id && file.currentHolderId === user.id) || user.role === 'ADMIN')) {
    throw ApiError.forbidden('This step is not assigned to you, or you do not currently hold this file');
  }

  const isApprove = input.action === 'approve';
  const isCheck = input.action === 'check';
  const isRevert = input.action === 'revert' || input.action === 'reject' || input.action === 'clarify';
  const label = { check: 'Checked', approve: 'Approved', revert: 'Reverted to originator', reject: 'Rejected', clarify: 'Clarification requested' }[input.action];

  await prisma.$transaction(async (tx) => {
    // Stamp the step (date/time + dept + typed signature).
    await tx.workflowStep.update({
      where: { id: current.id },
      data: {
        status: isApprove ? 'APPROVED' : isCheck ? 'CHECKED' : 'REVERTED',
        remarks: input.remarks || label,
        dept: input.dept || user.section,
        signatureName: input.signatureName || user.name,
        actedAt: new Date(),
      },
    });

    // Paragraph-level approval (SD §4.2): mark specific paragraphs of the note under review.
    if ((isApprove || isCheck) && input.paragraphs && input.paragraphs.length) {
      const target = await tx.note.findFirst({ where: { fileId }, orderBy: { noteNumber: 'desc' } });
      if (target) {
        await tx.paragraphApproval.createMany({
          data: input.paragraphs.map((p) => ({ noteId: target.id, paragraphMark: p, approvedById: user.id, approvedByName: input.signatureName || user.name })),
        });
      }
    }

    // Record the reviewer's remark as a note on the noting side.
    if (input.remarks && input.remarks.trim()) {
      const last = await tx.note.findFirst({ where: { fileId }, orderBy: { noteNumber: 'desc' } });
      await tx.note.create({
        data: {
          fileId, noteNumber: (last?.noteNumber ?? 0) + 1, content: input.remarks,
          authorId: user.id, authorName: user.name, authorRole: user.role,
          status: isApprove ? 'APPROVED' : isCheck ? 'CHECKED' : 'SUBMITTED', submittedAt: new Date(),
        },
      });
    }

    const mvType = isApprove ? 'APPROVE' : isCheck ? 'CHECK' : 'REVERT';

    if (isRevert) {
      const maker = await tx.user.findUnique({ where: { id: file.createdById } });
      await tx.file.update({ where: { id: fileId }, data: { status: 'REVERTED', currentHolderId: file.createdById, lastUsedAt: new Date() } });
      await tx.movement.create({
        data: { fileId, type: mvType, actorId: user.id, actorName: user.name, toUserId: file.createdById, toName: maker?.name, dept: input.dept || user.section, remarks: input.remarks || label },
      });
      return;
    }

    // check / approve → advance to the next pending step (if any)
    const next = steps.find((s) => s.stepOrder > current.stepOrder && s.status === 'PENDING');
    if (next) {
      await tx.file.update({ where: { id: fileId }, data: { status: 'UNDER_REVIEW', currentHolderId: next.assigneeId, lastUsedAt: new Date() } });
      await tx.movement.create({
        data: { fileId, type: mvType, actorId: user.id, actorName: user.name, toUserId: next.assigneeId, toName: next.assigneeName, dept: input.dept || user.section, remarks: input.remarks || label },
      });
    } else if (isApprove) {
      // Final approval.
      await tx.file.update({ where: { id: fileId }, data: { status: 'APPROVED', currentHolderId: null, lastUsedAt: new Date() } });
      await tx.movement.create({
        data: { fileId, type: mvType, actorId: user.id, actorName: user.name, dept: input.dept || user.section, remarks: input.remarks || 'Final approval' },
      });
    } else {
      // Checked but no further step: hand back to the originator to add an approver.
      await tx.file.update({ where: { id: fileId }, data: { currentHolderId: file.createdById, lastUsedAt: new Date() } });
      await tx.movement.create({
        data: { fileId, type: mvType, actorId: user.id, actorName: user.name, toUserId: file.createdById, dept: input.dept || user.section, remarks: input.remarks || 'Checked; awaiting approver' },
      });
    }
  });

  return getFileDetail(fileId);
}
