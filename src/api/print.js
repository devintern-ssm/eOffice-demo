import { apiBlob } from './client'

/** Fetch the print HTML (with auth) and open it in a new tab, ready for Print / Save-as-PDF.
 *  opts (noting side): { last?: boolean, fromNote?: number, toNote?: number } — A6 page range. */
export async function openPrint(fileId, side = 'noting', opts = {}) {
  const params = new URLSearchParams({ side })
  if (opts.last) params.set('last', 'true')
  if (opts.fromNote) params.set('fromNote', String(opts.fromNote))
  if (opts.toNote) params.set('toNote', String(opts.toNote))
  const blob = await apiBlob(`/files/${fileId}/print?${params.toString()}`)
  const w = window.open(URL.createObjectURL(blob), '_blank')
  if (!w) alert('Please allow pop-ups to open the print view.')
}
