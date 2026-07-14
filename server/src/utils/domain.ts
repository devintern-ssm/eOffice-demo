// Domain constants & value sets. On the Postgres switch these become native enums.

export const ROLES = ['MAKER', 'CHECKER', 'APPROVER', 'MD', 'ADMIN'] as const;
export type Role = (typeof ROLES)[number];

// File is a permanent binder — its only states are OPEN and (rarely) CLOSED.
export const FILE_STATUSES = ['OPEN', 'CLOSED'] as const;
export type FileStatus = (typeof FILE_STATUSES)[number];

// Each note runs its own lifecycle as it moves through its signature chain.
export const NOTE_STATUSES = ['DRAFT', 'IN_REVIEW', 'RETURNED', 'FINALIZED'] as const;
export type NoteStatus = (typeof NOTE_STATUSES)[number];

// A signer either signs & forwards, or sends the note back to its maker.
export const STEP_STATUSES = ['PENDING', 'SIGNED', 'RETURNED'] as const;
// Role labels are display-only now (any signer can check+approve).
export const STEP_ROLES = ['CHECKER', 'APPROVER', 'MD'] as const;

export const MOVEMENT_TYPES = [
  'CREATE', 'OPEN_NOTE', 'SUBMIT_NOTE', 'SIGN', 'RETURN_NOTE', 'FINALIZE',
  'HANDOVER', 'TRANSFER', 'CLOSE', 'UPLOAD', 'NOTE_ADDED', 'ASSIGN',
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
