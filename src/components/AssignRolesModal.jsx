import React, { useEffect, useState } from 'react'
import { FiX, FiUserCheck } from 'react-icons/fi'
import { listUsers, stepRoleForUser } from '../api/users'
import { assignMaker, forwardFile, addReviewer } from '../api/workflow'
import { assignParagraphApprover } from '../api/approvals'
import './Modal.css'

/** Assign Maker / Checker / Para-wise Approver for an existing file & its notes (review #2). */
const AssignRolesModal = ({ file, onClose, onSaved }) => {
  const [users, setUsers] = useState([])
  const [makerId, setMakerId] = useState(file.currentAssignee || '')
  const [checkerIds, setCheckerIds] = useState([])
  const [paraNoteId, setParaNoteId] = useState(file.notes?.[0]?.id || '')
  const [paraMark, setParaMark] = useState('A')
  const [paraApproverId, setParaApproverId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [msg, setMsg] = useState(null)

  const forwardable = ['DRAFT', 'SUBMITTED', 'REVERTED'].includes(file.status)
  const underReview = file.status === 'UNDER_REVIEW'

  useEffect(() => { listUsers().then(setUsers).catch((e) => setError(e.message)) }, [])

  const candidates = users.filter((u) => u.role !== 'ADMIN')

  const run = async (fn, ok) => {
    setBusy(true); setError(null); setMsg(null)
    try {
      const updated = await fn()
      onSaved && onSaved(updated)
      setMsg(ok)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const doMaker = () => {
    if (!makerId) { setError('Choose a Maker'); return }
    run(() => assignMaker(file.id, makerId), 'Maker assigned.')
  }

  const doCheckers = () => {
    const recipients = checkerIds
      .map((id) => users.find((u) => u.id === id))
      .filter(Boolean)
      .map((u) => ({ userId: u.id, role: stepRoleForUser(u.role) }))
    if (!recipients.length) { setError('Select at least one checker'); return }
    run(async () => {
      if (forwardable) return forwardFile(file.id, { recipients, remarks: '' })
      let updated
      for (const r of recipients) updated = await addReviewer(file.id, r) // eslint-disable-line no-await-in-loop
      return updated
    }, 'Checker(s) assigned.')
  }

  const doPara = () => {
    if (!paraNoteId) { setError('Choose a note'); return }
    if (!paraMark.trim()) { setError('Enter a paragraph mark (e.g. A)'); return }
    if (!paraApproverId) { setError('Choose an approver'); return }
    run(() => assignParagraphApprover(file.id, paraNoteId, { paragraphMark: paraMark, approverId: paraApproverId }), 'Paragraph approver assigned.')
  }

  const toggleChecker = (id) => setCheckerIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  const section = { border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, marginBottom: 14 }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2><FiUserCheck style={{ verticalAlign: '-2px' }} /> Assign Roles</h2>
          <button className="modal-close" onClick={onClose}><FiX /></button>
        </div>

        <div className="modal-body">
          {/* Maker */}
          <div style={section}>
            <label style={{ fontWeight: 600 }}>Maker (responsible officer)</label>
            <small style={{ display: 'block', color: '#718096', marginBottom: 8 }}>
              {forwardable ? 'Moves ownership before the file enters review.' : 'Locked — the file is already under review or closed.'}
            </small>
            <div style={{ display: 'flex', gap: 8 }}>
              <select value={makerId} onChange={(e) => setMakerId(e.target.value)} disabled={!forwardable} style={{ flex: 1 }}>
                <option value="">Select Maker…</option>
                {candidates.map((u) => <option key={u.id} value={u.id}>{u.name} — {u.section} ({u.role})</option>)}
              </select>
              <button type="button" className="btn-primary" disabled={busy || !forwardable} onClick={doMaker}>Assign</button>
            </div>
          </div>

          {/* Checkers */}
          <div style={section}>
            <label style={{ fontWeight: 600 }}>Checker(s){underReview ? ' to add' : ''}</label>
            <small style={{ display: 'block', color: '#718096', marginBottom: 8 }}>
              {forwardable ? 'Forwards the file into a sequential review chain.'
                : underReview ? 'Appended to the end of the current review chain.'
                : 'Not available — the file is not in a reviewable state.'}
            </small>
            <div className="reference-list" style={{ maxHeight: 150 }}>
              {candidates.map((u) => (
                <label key={u.id} className="reference-item">
                  <input type="checkbox" checked={checkerIds.includes(u.id)} onChange={() => toggleChecker(u.id)} disabled={!forwardable && !underReview} />
                  <span>{u.name} <em style={{ color: '#718096' }}>({stepRoleForUser(u.role)}) — {u.section}</em></span>
                </label>
              ))}
              {candidates.length === 0 && <div className="empty-ref">Loading users…</div>}
            </div>
            <button type="button" className="btn-primary" style={{ marginTop: 8 }} disabled={busy || (!forwardable && !underReview)} onClick={doCheckers}>
              Assign Checker(s)
            </button>
          </div>

          {/* Para-wise approver */}
          <div style={section}>
            <label style={{ fontWeight: 600 }}>Para-wise Approver</label>
            <small style={{ display: 'block', color: '#718096', marginBottom: 8 }}>
              Route a specific paragraph of a note to a nominated approver.
            </small>
            {file.notes?.length ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 1fr auto', gap: 8, alignItems: 'center' }}>
                <select value={paraNoteId} onChange={(e) => setParaNoteId(e.target.value)}>
                  {file.notes.map((n) => <option key={n.id} value={n.id}>Note {n.noteNumber}</option>)}
                </select>
                <input type="text" value={paraMark} onChange={(e) => setParaMark(e.target.value)} placeholder="Para" maxLength={3} />
                <select value={paraApproverId} onChange={(e) => setParaApproverId(e.target.value)}>
                  <option value="">Approver…</option>
                  {candidates.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                </select>
                <button type="button" className="btn-primary" disabled={busy} onClick={doPara}>Assign</button>
              </div>
            ) : <div className="empty-ref">No notes to assign yet.</div>}
          </div>

          {error && <div className="form-error" style={{ color: '#e53e3e', marginBottom: 8 }}>{error}</div>}
          {msg && <div style={{ color: '#2f855a', marginBottom: 8 }}>{msg}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Done</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AssignRolesModal
