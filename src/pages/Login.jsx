import React, { useState } from 'react'
import { useAuth } from '../auth/AuthContext'

const DEMO = [
  { label: 'Rajesh · Maker', email: 'rajesh.kumar@example.com' },
  { label: 'Priya · Checker', email: 'priya.sharma@example.com' },
  { label: 'Amit · Approver', email: 'amit.patel@example.com' },
  { label: 'MD Rao · MD', email: 'md@example.com' },
  { label: 'Sneha · Accounts Maker', email: 'sneha.reddy@example.com' },
  { label: 'Admin', email: 'admin@example.com' },
]

const inp = { width: '100%', padding: '9px 10px', border: '1px solid #cbd5e0', borderRadius: 8, margin: '4px 0 12px' }
const btn = { width: '100%', padding: 10, background: '#4c51bf', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }
const chip = { fontSize: 12, padding: '6px 8px', border: '1px solid #cbd5e0', borderRadius: 6, background: '#f7fafc', cursor: 'pointer' }

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('password123')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const doLogin = async (em, pw) => {
    setBusy(true); setError(null)
    try { await login(em, pw) } catch (err) { setError(err.message); setBusy(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7fafc' }}>
      <div style={{ width: 400, background: '#fff', borderRadius: 12, padding: 28, boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
        <h1 style={{ margin: '0 0 2px', fontSize: 24 }}>eOffice</h1>
        <p style={{ color: '#718096', marginTop: 0 }}>Noting–Correspondence File System</p>
        <form onSubmit={(e) => { e.preventDefault(); doLogin(email, password) }}>
          <label style={{ fontSize: 13 }}>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={inp} />
          <label style={{ fontSize: 13 }}>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inp} />
          {error && <div style={{ color: '#e53e3e', fontSize: 13, margin: '6px 0' }}>{error}</div>}
          <button type="submit" disabled={busy} style={btn}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <div style={{ marginTop: 16, borderTop: '1px solid #edf2f7', paddingTop: 12 }}>
          <div style={{ fontSize: 12, color: '#718096', marginBottom: 6 }}>Quick login (demo — password <code>password123</code>)</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {DEMO.map((d) => (
              <button key={d.email} type="button" onClick={() => doLogin(d.email, 'password123')} style={chip}>{d.label}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
