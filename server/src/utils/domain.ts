// Domain constants & value sets. On the Postgres switch these become native enums.

export const ROLES = ['MAKER', 'CHECKER', 'APPROVER', 'MD', 'ADMIN'] as const;
export type Role = (typeof ROLES)[number];

export const FILE_STATUSES = [
  'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'REVERTED', 'APPROVED', 'ROUTED', 'RETURNED', 'CLOSED',
] as const;
export type FileStatus = (typeof FILE_STATUSES)[number];

export const NOTE_STATUSES = ['DRAFT', 'SUBMITTED', 'CHECKED', 'APPROVED'] as const;
export const STEP_STATUSES = ['PENDING', 'CHECKED', 'APPROVED', 'REVERTED', 'SKIPPED'] as const;
export const STEP_ROLES = ['CHECKER', 'APPROVER', 'MD'] as const;

export const MOVEMENT_TYPES = [
  'CREATE', 'SUBMIT', 'FORWARD', 'CHECK', 'APPROVE', 'REVERT', 'RETURN',
  'ROUTE', 'TRANSFER', 'CLOSE', 'UPLOAD', 'NOTE_ADDED', 'SIGN', 'ASSIGN',
] as const;
export type MovementType = (typeof MOVEMENT_TYPES)[number];

export const SECTIONS = [
  'Administration', 'Accounts', 'Legal', 'Audit', 'Finance', 'Engineering',
] as const;

/** Section name -> short department code used in DEPT/YEAR/SEQ file numbers (D1). */
export const SECTION_CODE: Record<string, string> = {
  Administration: 'ADMIN',
  Accounts: 'ACC',
  Legal: 'LEGAL',
  Audit: 'AUDIT',
  Finance: 'FIN',
  Engineering: 'ENG',
};

export function deptCodeForSection(section: string): string {
  return SECTION_CODE[section] ?? section.slice(0, 4).toUpperCase();
}

/**
 * Allowed correspondence attachment formats (review #6 — multi-format support).
 * mime -> canonical file extension used when saving/serving the blob.
 */
export const ATTACHMENT_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/tiff': 'tif',
};

export function isAllowedAttachment(mime: string): boolean {
  return Boolean(ATTACHMENT_TYPES[mime]);
}

/** Canonical extension for a mime type, falling back to a filename's extension. */
export function extForAttachment(mime: string, originalName?: string): string {
  if (ATTACHMENT_TYPES[mime]) return ATTACHMENT_TYPES[mime];
  const dot = originalName?.lastIndexOf('.');
  if (originalName && dot !== undefined && dot > 0) return originalName.slice(dot + 1).toLowerCase();
  return 'bin';
}
