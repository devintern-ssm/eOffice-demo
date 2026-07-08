// API client. Auth is real now (login screen in 1.10): every call attaches the
// stored JWT; a 401 clears it and signals the app to show the login screen.

const TOKEN_KEY = 'eoffice_token'
const API_BASE = '/api/v1'

export function getToken() { return localStorage.getItem(TOKEN_KEY) }
export function setToken(token) { localStorage.setItem(TOKEN_KEY, token) }
export function clearToken() { localStorage.removeItem(TOKEN_KEY) }

class Unauthenticated extends Error {
  constructor() { super('Not authenticated'); this.status = 401 }
}

async function req(path, options = {}) {
  const token = getToken()
  if (!token) throw new Unauthenticated()
  const isForm = options.body instanceof FormData
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body && !isForm ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  })
  if (res.status === 401) {
    clearToken()
    window.dispatchEvent(new Event('eoffice-unauth'))
    throw new Unauthenticated()
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error?.message || `Request failed (${res.status})`)
  }
  return res
}

export async function apiFetch(path, options = {}) {
  return (await req(path, options)).json()
}

export async function apiUpload(path, formData) {
  return (await req(path, { method: 'POST', body: formData })).json()
}

export async function apiBlob(path) {
  return (await req(path, {})).blob()
}
