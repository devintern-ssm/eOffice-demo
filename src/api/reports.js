import { apiFetch, apiBlob } from './client'

function qs(params) {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== 'all')
  const s = new URLSearchParams(entries).toString()
  return s ? `?${s}` : ''
}

export function getReport(params = {}) {
  return apiFetch(`/reports${qs(params)}`)
}

export async function exportReport(params = {}) {
  const blob = await apiBlob(`/reports/export${qs(params)}`)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'eoffice-report.csv'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
