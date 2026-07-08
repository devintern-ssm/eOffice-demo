import { apiFetch } from './client'

export const routeToDept = (fileId, body) => apiFetch(`/files/${fileId}/route`, { method: 'POST', body: JSON.stringify(body) }).then((d) => d.file)
export const returnToMaker = (fileId, body) => apiFetch(`/files/${fileId}/return`, { method: 'POST', body: JSON.stringify(body) }).then((d) => d.file)
export const transferFile = (fileId, body) => apiFetch(`/files/${fileId}/transfer`, { method: 'POST', body: JSON.stringify(body) }).then((d) => d.file)
export const closeFile = (fileId, body) => apiFetch(`/files/${fileId}/close`, { method: 'POST', body: JSON.stringify(body) }).then((d) => d.file)
