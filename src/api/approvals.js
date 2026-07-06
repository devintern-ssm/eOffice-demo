import { apiFetch, apiUpload } from './client'

export function uploadMdApproval(fileId, { remarks, file }) {
  const fd = new FormData()
  if (remarks) fd.append('remarks', remarks)
  if (file) fd.append('file', file)
  return apiUpload(`/files/${fileId}/md-approval`, fd).then((d) => d.file)
}

export function addNoteComment(fileId, noteId, comment) {
  return apiFetch(`/files/${fileId}/notes/${noteId}/comments`, { method: 'POST', body: JSON.stringify({ comment }) }).then((d) => d.file)
}

/** Assign a paragraph-wise approver to a note. body: { paragraphMark, approverId } */
export function assignParagraphApprover(fileId, noteId, { paragraphMark, approverId }) {
  return apiFetch(`/files/${fileId}/notes/${noteId}/assign-approver`, {
    method: 'POST', body: JSON.stringify({ paragraphMark, approverId }),
  }).then((d) => d.file)
}
