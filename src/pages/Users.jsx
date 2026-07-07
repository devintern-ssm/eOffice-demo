import React, { useEffect, useState } from 'react'
import { FiUserPlus, FiX, FiKey } from 'react-icons/fi'
import { useAuth } from '../auth/AuthContext'
import { listAllUsers, createUser, updateUser, resetUserPassword } from '../api/users'
import '../components/Modal.css'

const ROLES = ['MAKER', 'CHECKER', 'APPROVER', 'MD', 'ADMIN']
const SECTIONS = ['Administration', 'Accounts', 'Legal', 'Audit', 'Finance', 'Engineering']
const td = { padding: '10px 12px', borderBottom: '1px solid #edf2f7', verticalAlign: 'middle', fontSize: 13 }
const th = { padding: '10px 12px', borderBottom: '1px solid #e2e8f0', textAlign: 'left', fontSize: 12, color: '#718096', textTransform: 'uppercase' }

const emptyForm = { name: '', designation: '', section: 'Administration', role: 'MAKER', email: '', password: '' }

const Users = () => {
  const { user: me } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(null) // id currently mutating
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formErr, setFormErr] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    listAllUsers().then((u) => { setUsers(u); setError(null) }).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const mutate = async (id, fn) => {
    setBusy(id)
    try { await fn(); load() } catch (e) { alert(e.message) } finally { setBusy(null) }
  }

  const changeRole = (u, role) => mutate(u.id, () => updateUser(u.id, { role }))
  const changeSection = (u, section) => mutate(u.id, () => updateUser(u.id, { section }))
  const toggleActive = (u) => mutate(u.id, () => updateUser(u.id, { active: !u.active }))
  const resetPw = (u) => {
    const pw = window.prompt(`New password for ${u.name} (min 6 chars):`)
    if (!pw) return
    if (pw.length < 6) { alert('Password must be at least 6 characters'); return }
    mutate(u.id, () => resetUserPassword(u.id, pw))
  }

  const submitNew = async (e) => {
    e.preventDefault()
    setFormErr(null)
    if (form.password.length < 6) { setFormErr('Password must be at least 6 characters'); return }
    setSaving(true)
    try {
      await createUser(form)
      setShowAdd(false); setForm(emptyForm); load()
    } catch (err) { setFormErr(err.message) } finally { setSaving(false) }
  }

  const field = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div style={{ padding: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1>User Management</h1>
        <button className="btn-primary" onClick={() => setShowAdd(true)}><FiUserPlus /> Add User</button>
      </div>

      <div style={{ background: '#fff', borderRadius: 10, overflow: 'auto' }}>
        {loading ? <div style={{ padding: 20, color: '#718096' }}>Loading…</div>
          : error ? <div style={{ padding: 20, color: '#e53e3e' }}>Couldn’t load users: {error}</div>
          : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f7fafc' }}>
                  {['Name', 'Email', 'Designation', 'Department', 'Role', 'Status', 'Actions'].map((h) => <th key={h} style={th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isMe = u.id === me?.id
                  return (
                    <tr key={u.id} style={{ opacity: u.active ? 1 : 0.55 }}>
                      <td style={td}><strong>{u.name}</strong>{isMe && <span style={{ color: '#4c51bf', fontSize: 11 }}> (you)</span>}</td>
                      <td style={td}>{u.email}</td>
                      <td style={td}>{u.designation}</td>
                      <td style={td}>
                        <select value={u.section} disabled={busy === u.id} onChange={(e) => changeSection(u, e.target.value)} style={{ padding: 4, borderRadius: 6, border: '1px solid #cbd5e0' }}>
                          {SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td style={td}>
                        <select value={u.role} disabled={busy === u.id || isMe} onChange={(e) => changeRole(u, e.target.value)} style={{ padding: 4, borderRadius: 6, border: '1px solid #cbd5e0' }}>
                          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
                      <td style={td}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, color: '#fff', background: u.active ? '#38a169' : '#a0aec0' }}>
                          {u.active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td style={{ ...td, whiteSpace: 'nowrap' }}>
                        <button className="corr-btn" style={{ display: 'inline-flex', width: 'auto', marginRight: 6 }} disabled={busy === u.id || isMe} onClick={() => toggleActive(u)}>
                          {u.active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button className="corr-btn" style={{ display: 'inline-flex', width: 'auto' }} disabled={busy === u.id} onClick={() => resetPw(u)}>
                          <FiKey /> Reset PW
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add User</h2>
              <button className="modal-close" onClick={() => setShowAdd(false)}><FiX /></button>
            </div>
            <form onSubmit={submitNew} className="modal-body">
              <div className="form-group"><label>Full name *</label><input value={form.name} onChange={field('name')} required /></div>
              <div className="form-group"><label>Designation *</label><input value={form.designation} onChange={field('designation')} required /></div>
              <div className="form-row">
                <div className="form-group"><label>Department *</label>
                  <select value={form.section} onChange={field('section')}>{SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}</select>
                </div>
                <div className="form-group"><label>Role *</label>
                  <select value={form.role} onChange={field('role')}>{ROLES.map((r) => <option key={r} value={r}>{r}</option>)}</select>
                </div>
              </div>
              <div className="form-group"><label>Email *</label><input type="email" value={form.email} onChange={field('email')} required /></div>
              <div className="form-group"><label>Temporary password *</label><input type="text" value={form.password} onChange={field('password')} placeholder="min 6 characters" required /></div>
              {formErr && <div className="form-error" style={{ color: '#e53e3e', marginBottom: 8 }}>{formErr}</div>}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Users
