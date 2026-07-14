import { apiFetch } from './client'

/** Hand an idle binder to another person so they can raise the next note. body: { toUserId, remarks? } */
export const handoverFile = (fileId, body) => apiFetch(`/files/${fileId}/handover`, { method: 'POST', body: JSON.stringify(body) }).then((d) => d.file)

/** Permanent cross-department transfer. body: { toSection, toUserId?, reason? } */
export const transferFile = (fileId, body) => apiFetch(`/files/${fileId}/transfer`, { method: 'POST', body: JSON.stringify(body) }).then((d) => d.file)

/** Close a binder (rare). body: { reason, successorFileId? } */
export const closeFile = (fileId, body) => apiFetch(`/files/${fileId}/close`, { method: 'POST', body: JSON.stringify(body) }).then((d) => d.file)
