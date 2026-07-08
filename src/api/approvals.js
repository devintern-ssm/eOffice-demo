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

/** Assign a Checker/Approver to a specific note (optional paragraph).
 *  body: { approverId, role?: 'CHECKER'|'APPROVER', paragraphMark? } */
export function assignParagraphApprover(fileId, noteId, { paragraphMark, approverId, role }) {
  return apiFetch(`/files/${fileId}/notes/${noteId}/assign-approver`, {
    method: 'POST', body: JSON.stringify({ paragraphMark, approverId, role }),
  }).then((d) => d.file)
}
