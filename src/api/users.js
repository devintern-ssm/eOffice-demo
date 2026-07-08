import { apiFetch } from './client'

export function listUsers(section) {
  const qs = section ? `?section=${encodeURIComponent(section)}` : ''
  return apiFetch(`/users${qs}`).then((d) => d.users)
}

/** Admin: all users incl. inactive, with email + active flag. */
export function listAllUsers() {
  return apiFetch('/users/all').then((d) => d.users)
}

/** Admin: create a user. body: { name, designation, section, role, email, password } */
export function createUser(body) {
  return apiFetch('/users', { method: 'POST', body: JSON.stringify(body) }).then((d) => d.user)
}

/** Admin: update a user. body: { role?, section?, designation?, active? } */
export function updateUser(id, body) {
  return apiFetch(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }).then((d) => d.user)
}

/** Admin: set a new password for a user. */
export function resetUserPassword(id, password) {
  return apiFetch(`/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ password }) })
}

/** Map a user's role to a workflow step role. */
export function stepRoleForUser(role) {
  if (role === 'APPROVER') return 'APPROVER'
  if (role === 'MD') return 'MD'
  return 'CHECKER'
}
