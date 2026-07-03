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
  'ROUTE', 'TRANSFER', 'CLOSE', 'UPLOAD', 'NOTE_ADDED', 'SIGN',
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
