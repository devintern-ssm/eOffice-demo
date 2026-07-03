import { apiUpload, apiBlob } from './client'

/** Upload a correspondence document (PDF) or an email reference.
 *  fields: { type, title, inwardDate?, inwardNumber?, emailReference?, file? } */
export function addCorrespondence(fileId, fields) {
  const fd = new FormData()
  fd.append('type', fields.type)
  fd.append('title', fields.title)
  if (fields.inwardDate) fd.append('inwardDate', fields.inwardDate)
  if (fields.inwardNumber) fd.append('inwardNumber', fields.inwardNumber)
  if (fields.emailReference) fd.append('emailReference', fields.emailReference)
  if (fields.file) fd.append('file', fields.file)
  return apiUpload(`/files/${fileId}/correspondence`, fd).then((d) => d.correspondence)
}

async function fetchBlob(fileId, corrId) {
  return apiBlob(`/files/${fileId}/correspondence/${corrId}/file`)
}

export async function viewCorrespondence(fileId, corrId) {
  const blob = await fetchBlob(fileId, corrId)
  window.open(URL.createObjectURL(blob), '_blank')
}

export async function downloadCorrespondence(fileId, corrId, filename = 'correspondence.pdf') {
  const blob = await fetchBlob(fileId, corrId)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
