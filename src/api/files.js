import { apiFetch } from './client'

/** List files. params: { section, un, status, mine, search }. Blank/'all' are dropped. */
export function listFiles(params = {}) {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '' && v !== 'all',
  )
  const qs = new URLSearchParams(entries).toString()
  return apiFetch(`/files${qs ? `?${qs}` : ''}`).then((d) => d.files)
}

export function getFile(id) {
  return apiFetch(`/files/${id}`).then((d) => d.file)
}

export function createFile(body) {
  return apiFetch('/files', { method: 'POST', body: JSON.stringify(body) }).then((d) => d.file)
}

export function submitFile(id) {
  return apiFetch(`/files/${id}/submit`, { method: 'POST' }).then((d) => d.file)
}

/** Dashboard KPIs + recent activity. Returns { stats, recentActivity }. */
export function getStats() {
  return apiFetch('/files/stats')
}
