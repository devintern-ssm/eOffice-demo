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
  const [reviewers, setReviewers] = useState({}) // userId -> role
  const [paraNoteId, setParaNoteId] = useState(file.notes?.[0]?.id || '')
  const [paraMark, setParaMark] = useState('')
  const [paraRole, setParaRole] = useState('APPROVER')
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
    const recipients = Object.entries(reviewers).map(([userId, role]) => ({ userId, role }))
    if (!recipients.length) { setError('Select at least one reviewer'); return }
    run(async () => {
      if (forwardable) return forwardFile(file.id, { recipients, remarks: '' })
      let updated
      for (const r of recipients) updated = await addReviewer(file.id, r) // eslint-disable-line no-await-in-loop
      return updated
    }, 'Reviewer(s) assigned.')
  }

  const doPara = () => {
    if (!paraNoteId) { setError('Choose a note'); return }
    if (!paraApproverId) { setError('Choose a person'); return }
    run(() => assignParagraphApprover(file.id, paraNoteId, { paragraphMark: paraMark, approverId: paraApproverId, role: paraRole }), 'Note reviewer assigned.')
  }

  const STEP_ROLES = ['CHECKER', 'APPROVER', 'MD']
  const toggleReviewer = (u) => setReviewers((prev) => {
    const next = { ...prev }
    if (next[u.id]) delete next[u.id]; else next[u.id] = stepRoleForUser(u.role)
    return next
  })
  const setReviewerRole = (id, role) => setReviewers((prev) => ({ ...prev, [id]: role }))

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

          {/* Reviewers — Checker / Approver / MD */}
          <div style={section}>
            <label style={{ fontWeight: 600 }}>Reviewers (Checker / Approver / MD){underReview ? ' — add to chain' : ''}</label>
            <small style={{ display: 'block', color: '#718096', marginBottom: 8 }}>
              {forwardable ? 'Forwards the file into a sequential review chain — pick each reviewer’s role.'
                : underReview ? 'Appended to the end of the current review chain.'
                : 'Not available — the file is not in a reviewable state.'}
            </small>
            <div className="reference-list" style={{ maxHeight: 160 }}>
              {candidates.map((u) => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                  <label className="reference-item" style={{ flex: 1, margin: 0 }}>
                    <input type="checkbox" checked={!!reviewers[u.id]} onChange={() => toggleReviewer(u)} disabled={!forwardable && !underReview} />
                    <span>{u.name} <em style={{ color: '#718096' }}>— {u.section}</em></span>
                  </label>
                  {reviewers[u.id] && (
                    <select value={reviewers[u.id]} onChange={(e) => setReviewerRole(u.id, e.target.value)} style={{ padding: 4, borderRadius: 6, border: '1px solid #cbd5e0' }}>
                      {STEP_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  )}
                </div>
              ))}
              {candidates.length === 0 && <div className="empty-ref">Loading users…</div>}
            </div>
            <button type="button" className="btn-primary" style={{ marginTop: 8 }} disabled={busy || (!forwardable && !underReview)} onClick={doCheckers}>
              Assign Reviewer(s)
            </button>
          </div>

          {/* Reviewer for a specific note (observation #6) */}
          <div style={section}>
            <label style={{ fontWeight: 600 }}>Reviewer for a specific note</label>
            <small style={{ display: 'block', color: '#718096', marginBottom: 8 }}>
              Assign a Checker or Approver to a chosen note (e.g. “Note 3 approved by …”). Paragraph is optional.
            </small>
            {file.notes?.length ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 80px 1fr auto', gap: 8, alignItems: 'center' }}>
                <select value={paraNoteId} onChange={(e) => setParaNoteId(e.target.value)}>
                  {file.notes.map((n) => <option key={n.id} value={n.id}>Note {n.noteNumber}</option>)}
                </select>
                <select value={paraRole} onChange={(e) => setParaRole(e.target.value)}>
                  <option value="APPROVER">Approver</option>
                  <option value="CHECKER">Checker</option>
                </select>
                <input type="text" value={paraMark} onChange={(e) => setParaMark(e.target.value)} placeholder="Para / note (opt.)" title="Optional paragraph or note reference" />
                <select value={paraApproverId} onChange={(e) => setParaApproverId(e.target.value)}>
                  <option value="">Person…</option>
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
