import React, { useEffect, useState } from 'react'
import { FiX, FiSend, FiPlus, FiTrash2 } from 'react-icons/fi'
import { useAuth } from '../auth/AuthContext'
import { addNote } from '../api/notes'
import { listFiles } from '../api/files'
import { listUsers, stepRoleForUser } from '../api/users'
import { forwardFile, addReviewer, assignMaker } from '../api/workflow'
import { assignParagraphApprover } from '../api/approvals'
import './Modal.css'

const STEP_ROLES = ['CHECKER', 'APPROVER', 'MD']

const AddNoteModal = ({ file, onClose, onSaved }) => {
  const { user } = useAuth()
  const [noteContent, setNoteContent] = useState('')
  const [selectedCorr, setSelectedCorr] = useState([])
  const [selectedNotes, setSelectedNotes] = useState([])
  const [searchApprovedFiles, setSearchApprovedFiles] = useState('')
  const [approvedFilesResults, setApprovedFilesResults] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // Role assignment while creating a note (reviews #1/#2/#3)
  const [users, setUsers] = useState([])
  const [makerId, setMakerId] = useState(user?.id || '')
  const [reviewers, setReviewers] = useState({}) // userId -> role (CHECKER|APPROVER|MD)
  const [paras, setParas] = useState([]) // [{ mark, approverId }]

  const canAssign = ['DRAFT', 'SUBMITTED', 'REVERTED', 'UNDER_REVIEW'].includes(file.status)
  const forwardable = ['DRAFT', 'SUBMITTED', 'REVERTED'].includes(file.status)

  useEffect(() => { if (canAssign) listUsers().then(setUsers).catch(() => {}) }, [canAssign])

  const candidates = users.filter((u) => u.id !== user?.id && u.role !== 'ADMIN')

  const toggleReviewer = (u) => {
    setReviewers((prev) => {
      const next = { ...prev }
      if (next[u.id]) delete next[u.id]
      else next[u.id] = stepRoleForUser(u.role)
      return next
    })
  }
  const setReviewerRole = (id, role) => setReviewers((prev) => ({ ...prev, [id]: role }))

  const addParaRow = () => setParas((p) => [...p, { mark: '', approverId: '', role: 'APPROVER' }])
  const setPara = (i, key, val) => setParas((p) => p.map((row, idx) => (idx === i ? { ...row, [key]: val } : row)))
  const removePara = (i) => setParas((p) => p.filter((_, idx) => idx !== i))

  const applyAssignments = async (noteId) => {
    // Per-note reviewers first (creator is still authorised) (#3/#6)
    for (const row of paras) {
      if (row.approverId) {
        // eslint-disable-next-line no-await-in-loop
        await assignParagraphApprover(file.id, noteId, { paragraphMark: row.mark.trim(), approverId: row.approverId, role: row.role })
      }
    }
    // Reviewer chain (#2 — explicit Checker/Approver/MD roles)
    const recipients = Object.entries(reviewers).map(([userId, role]) => ({ userId, role }))
    if (recipients.length) {
      if (forwardable) await forwardFile(file.id, { recipients, remarks: '' })
      else for (const r of recipients) await addReviewer(file.id, r) // eslint-disable-line no-await-in-loop
    } else if (forwardable && makerId && makerId !== user?.id) {
      await assignMaker(file.id, makerId)
    }
  }

  const save = async (isDraft) => {
    if (!noteContent.trim()) { setError('Note content is required'); return }
    setSubmitting(true)
    setError(null)
    try {
      const created = await addNote(file.id, {
        content: noteContent,
        isDraft,
        references: { correspondence: selectedCorr, notes: selectedNotes.map((n) => `Note ${n}`) },
      })
      if (!isDraft && canAssign) await applyAssignments(created.id)
      onSaved && onSaved()
      onClose()
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  const handleSubmit = (e) => { e.preventDefault(); save(false) }

  const handleSearchApprovedFiles = async (searchTerm) => {
    setSearchApprovedFiles(searchTerm)
    if (searchTerm.length > 2) {
      try { setApprovedFilesResults(await listFiles({ status: 'APPROVED', search: searchTerm })) } catch { setApprovedFilesResults([]) }
    } else setApprovedFilesResults([])
  }

  const handleCopyReference = (approvedFile) => {
    const reference = `Refer approved file ${approvedFile.fileNumber}: ${approvedFile.subject}`
    setNoteContent((prev) => (prev ? `${prev}\n${reference}` : reference))
    setSearchApprovedFiles(''); setApprovedFilesResults([])
  }

  const toggleCorr = (n) => setSelectedCorr((p) => (p.includes(n) ? p.filter((c) => c !== n) : [...p, n]))
  const toggleNote = (n) => setSelectedNotes((p) => (p.includes(n) ? p.filter((x) => x !== n) : [...p, n]))

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Note</h2>
          <button className="modal-close" onClick={onClose}><FiX /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Note Content *</label>
            <textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Enter your note here. You can reference correspondence (e.g., Refer C/1) or previous notes (e.g., Refer Note 1)..." rows={9} />
          </div>

          <div className="form-group">
            <label>Search Approved Files</label>
            <div className="search-approved-files">
              <input type="text" value={searchApprovedFiles} onChange={(e) => handleSearchApprovedFiles(e.target.value)}
                placeholder="Search approved files to copy references..." className="search-input" />
              {approvedFilesResults.length > 0 && (
                <div className="approved-files-results">
                  {approvedFilesResults.map((af) => (
                    <div key={af.id} className="approved-file-item" onClick={() => handleCopyReference(af)}>
                      <div className="file-ref">{af.fileNumber}</div>
                      <div className="file-subject">{af.subject}</div>
                      <small>Click to copy reference</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Reference Correspondence</label>
              <div className="reference-list">
                {file.correspondence.map((corr) => (
                  <label key={corr.id} className="reference-item">
                    <input type="checkbox" checked={selectedCorr.includes(corr.number)} onChange={() => toggleCorr(corr.number)} />
                    <span>{corr.number} - {corr.title}</span>
                  </label>
                ))}
                {file.correspondence.length === 0 && <div className="empty-ref">No correspondence available</div>}
              </div>
            </div>
            <div className="form-group">
              <label>Reference Previous Notes</label>
              <div className="reference-list">
                {file.notes.map((note) => (
                  <label key={note.id} className="reference-item">
                    <input type="checkbox" checked={selectedNotes.includes(note.noteNumber)} onChange={() => toggleNote(note.noteNumber)} />
                    <span>Note {note.noteNumber}</span>
                  </label>
                ))}
                {file.notes.length === 0 && <div className="empty-ref">No previous notes</div>}
              </div>
            </div>
          </div>

          {/* Assign Maker & reviewers with explicit roles (reviews #1/#2) */}
          {canAssign && (
            <div className="form-group" style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
              <label style={{ fontWeight: 600 }}>Assign reviewers (optional)</label>
              <small style={{ display: 'block', marginBottom: 8, color: '#718096' }}>
                Applied when you <strong>Submit</strong>. Pick each reviewer and their role — Checker, Approver or MD.
              </small>
              <div className="form-group">
                <label>Maker (responsible officer)</label>
                <select value={makerId} onChange={(e) => setMakerId(e.target.value)} disabled={!forwardable}>
                  <option value={user?.id || ''}>{user?.name} (you)</option>
                  {candidates.map((u) => <option key={u.id} value={u.id}>{u.name} — {u.section} ({u.role})</option>)}
                </select>
              </div>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Reviewer chain</label>
              <div className="reference-list" style={{ maxHeight: 170 }}>
                {candidates.map((u) => (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                    <label className="reference-item" style={{ flex: 1, margin: 0 }}>
                      <input type="checkbox" checked={!!reviewers[u.id]} onChange={() => toggleReviewer(u)} />
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
              {Object.keys(reviewers).length > 0 && (
                <small style={{ color: '#4c51bf' }}>On submit, the file is sent through {Object.keys(reviewers).length} reviewer(s) in order.</small>
              )}

              {/* Per-note reviewers — Checker/Approver for this note, optional paragraph (#3/#6) */}
              <div style={{ marginTop: 10 }}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Reviewers for this note (optional)</label>
                {paras.map((row, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6 }}>
                    <select value={row.role} onChange={(e) => setPara(i, 'role', e.target.value)} style={{ width: 110 }}>
                      <option value="APPROVER">Approver</option>
                      <option value="CHECKER">Checker</option>
                    </select>
                    <input type="text" value={row.mark} onChange={(e) => setPara(i, 'mark', e.target.value)} placeholder="Para / note (opt.)" style={{ width: 140 }} />
                    <select value={row.approverId} onChange={(e) => setPara(i, 'approverId', e.target.value)} style={{ flex: 1 }}>
                      <option value="">Person…</option>
                      {candidates.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                    </select>
                    <button type="button" className="corr-btn" style={{ width: 'auto', padding: '6px 8px' }} onClick={() => removePara(i)}><FiTrash2 /></button>
                  </div>
                ))}
                <button type="button" className="corr-btn" style={{ width: 'auto', marginTop: 6, display: 'inline-flex' }} onClick={addParaRow}><FiPlus /> Add note reviewer</button>
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Author</label>
            <div className="author-display">{user?.name} - {user?.designation}</div>
          </div>

          {error && <div className="form-error" style={{ color: '#e53e3e', marginBottom: 12 }}>{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="button" className="btn-draft" onClick={() => save(true)} disabled={submitting}>
              {submitting ? 'Saving…' : 'Save Draft'}
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              <FiSend /> {submitting ? 'Submitting…' : 'Submit Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddNoteModal
