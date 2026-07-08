import { apiFetch } from './client'

/** Active departments (for pickers). Returns [{ id, name, code }]. */
export function listDepartments() {
  return apiFetch('/departments').then((d) => d.departments)
}

/** Admin: all departments incl. inactive. */
export function listAllDepartments() {
  return apiFetch('/departments/all').then((d) => d.departments)
}

export function createDepartment(body) {
  return apiFetch('/departments', { method: 'POST', body: JSON.stringify(body) }).then((d) => d.department)
}

export function updateDepartment(id, body) {
  return apiFetch(`/departments/${id}`, { method: 'PATCH', body: JSON.stringify(body) }).then((d) => d.department)
}
