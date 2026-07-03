// File workflow statuses (match the backend domain enum).
export const FILE_STATUSES = [
  'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'REVERTED', 'APPROVED', 'ROUTED', 'RETURNED', 'CLOSED',
]

export function prettyStatus(s) {
  if (!s) return ''
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function statusColor(s) {
  switch (s) {
    case 'DRAFT': return '#a0aec0'
    case 'SUBMITTED': return '#4299e1'
    case 'UNDER_REVIEW': return '#ed8936'
    case 'REVERTED': return '#e53e3e'
    case 'APPROVED': return '#38b2ac'
    case 'ROUTED': return '#805ad5'
    case 'RETURNED': return '#d69e2e'
    case 'CLOSED': return '#718096'
    default: return '#a0aec0'
  }
}
