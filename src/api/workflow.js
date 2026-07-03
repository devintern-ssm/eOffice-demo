import { apiFetch } from './client'

/** Forward/route a DRAFT or REVERTED file into the review chain. body: { recipients:[{userId,role}], remarks } */
export function forwardFile(fileId, body) {
  return apiFetch(`/files/${fileId}/forward`, { method: 'POST', body: JSON.stringify(body) }).then((d) => d.file)
}

/** Act on the current review step. body: { action, remarks, dept, signatureName } */
export function actOnFile(fileId, body) {
  return apiFetch(`/files/${fileId}/action`, { method: 'POST', body: JSON.stringify(body) }).then((d) => d.file)
}

/** Add a reviewer/recipient mid-flow. body: { userId, role } */
export function addReviewer(fileId, body) {
  return apiFetch(`/files/${fileId}/steps`, { method: 'POST', body: JSON.stringify(body) }).then((d) => d.file)
}

/** Remove a pending reviewer step. */
export function removeStep(fileId, stepId) {
  return apiFetch(`/files/${fileId}/steps/${stepId}`, { method: 'DELETE' }).then((d) => d.file)
}
