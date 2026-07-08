import { setToken, apiFetch } from './client'

const API_BASE = '/api/v1'

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error?.message || 'Login failed')
  }
  const data = await res.json()
  setToken(data.token)
  return data.user
}

export function me() {
  return apiFetch('/auth/me').then((d) => d.user)
}
