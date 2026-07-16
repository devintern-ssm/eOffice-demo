// Shared, readable date-time format used across the app (Notes, File Movement, history, …)
// e.g. "14 Jul 2026, 03:40 PM". Keeping one formatter guarantees every section matches.
export function fmtDateTime(d) {
  if (!d) return ''
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return ''
  return dt.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}
