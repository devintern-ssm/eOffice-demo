import { apiFetch } from './client'

/** Add a note to a file. body: { content, isDraft?, isSuoMoto?, references? } */
export function addNote(fileId, body) {
  return apiFetch(`/files/${fileId}/notes`, { method: 'POST', body: JSON.stringify(body) }).then((d) => d.note)
}

/** Submit a saved draft note (DRAFT -> SUBMITTED). */
export function submitNote(fileId, noteId) {
  return apiFetch(`/files/${fileId}/notes/${noteId}/submit`, { method: 'POST' }).then((d) => d.note)
}

/** Edit a draft or reverted note's content. Returns the updated file detail. */
export function updateNote(fileId, noteId, content) {
  return apiFetch(`/files/${fileId}/notes/${noteId}`, { method: 'PATCH', body: JSON.stringify({ content }) }).then((d) => d.file)
}
