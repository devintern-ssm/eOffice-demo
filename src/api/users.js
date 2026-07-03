import { apiFetch } from './client'

export function listUsers(section) {
  const qs = section ? `?section=${encodeURIComponent(section)}` : ''
  return apiFetch(`/users${qs}`).then((d) => d.users)
}

/** Map a user's role to a workflow step role. */
export function stepRoleForUser(role) {
  if (role === 'APPROVER') return 'APPROVER'
  if (role === 'MD') return 'MD'
  return 'CHECKER'
}
