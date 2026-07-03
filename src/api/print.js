import { apiBlob } from './client'

/** Fetch the print HTML (with auth) and open it in a new tab, ready for Print / Save-as-PDF. */
export async function openPrint(fileId, side = 'noting') {
  const blob = await apiBlob(`/files/${fileId}/print?side=${side}`)
  const w = window.open(URL.createObjectURL(blob), '_blank')
  if (!w) alert('Please allow pop-ups to open the print view.')
}
