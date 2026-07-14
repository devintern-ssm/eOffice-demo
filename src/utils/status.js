// File is a permanent binder: OPEN | CLOSED. Notes run their own lifecycle.
export const FILE_STATUSES = ['OPEN', 'CLOSED']
export const NOTE_STATUSES = ['DRAFT', 'IN_REVIEW', 'RETURNED', 'FINALIZED']

const LABELS = {
  OPEN: 'Open', CLOSED: 'Closed',
  DRAFT: 'Draft', IN_REVIEW: 'In Review', RETURNED: 'Returned', FINALIZED: 'Finalized',
  PENDING: 'Awaiting', SIGNED: 'Signed',
}

export function prettyStatus(s) {
  if (!s) return ''
  return LABELS[s] || s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function statusColor(s) {
  switch (s) {
    case 'OPEN': return '#38a169'
    case 'CLOSED': return '#718096'
    case 'DRAFT': return '#a0aec0'
    case 'IN_REVIEW': return '#ed8936'
    case 'RETURNED': return '#d69e2e'
    case 'FINALIZED': return '#38b2ac'
    case 'PENDING': return '#a0aec0'
    case 'SIGNED': return '#38b2ac'
    default: return '#a0aec0'
  }
}
