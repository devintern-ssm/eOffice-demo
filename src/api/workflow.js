import { apiFetch } from './client'

/** Sign & forward the in-flight note (advances the chain, or finalizes on the last signer).
 *  body: { remarks?, dept?, signatureName? } */
export function signNote(fileId, body) {
  return apiFetch(`/files/${fileId}/sign`, { method: 'POST', body: JSON.stringify(body || {}) }).then((d) => d.file)
}

/** Send the in-flight note back to its maker. body: { remarks? } */
export function returnNote(fileId, body) {
  return apiFetch(`/files/${fileId}/return`, { method: 'POST', body: JSON.stringify(body || {}) }).then((d) => d.file)
}

/** Append a signer to the in-flight note's chain. body: { userId, roleLabel? } */
export function addSigner(fileId, body) {
  return apiFetch(`/files/${fileId}/signers`, { method: 'POST', body: JSON.stringify(body) }).then((d) => d.file)
}
