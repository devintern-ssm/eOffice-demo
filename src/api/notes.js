import { apiFetch } from './client'

/** Open the next note (optionally submit it immediately with a signer chain).
 *  body: { content, isDraft?, isSuoMoto?, references?, signers?:[{userId,roleLabel?}] }
 *  Returns the updated file detail. */
export function addNote(fileId, body) {
  return apiFetch(`/files/${fileId}/notes`, { method: 'POST', body: JSON.stringify(body) }).then((d) => d.file)
}

/** Put a saved draft / returned note up for signature. body: { signers?, remarks? } */
export function submitNote(fileId, noteId, body) {
  return apiFetch(`/files/${fileId}/notes/${noteId}/submit`, { method: 'POST', body: JSON.stringify(body || {}) }).then((d) => d.file)
}

/** Edit a draft / returned note. body: { content?, references? }. Returns updated file detail. */
export function updateNote(fileId, noteId, body) {
  return apiFetch(`/files/${fileId}/notes/${noteId}`, { method: 'PATCH', body: JSON.stringify(body) }).then((d) => d.file)
}
