import { apiFetch } from './client'

/** Add a note to a file. body: { content, isDraft?, isSuoMoto?, references? } */
export function addNote(fileId, body) {
  return apiFetch(`/files/${fileId}/notes`, { method: 'POST', body: JSON.stringify(body) }).then((d) => d.note)
}
