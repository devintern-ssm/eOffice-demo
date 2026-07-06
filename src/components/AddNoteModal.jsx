import React, { useEffect, useState } from 'react'
import { FiX, FiSend } from 'react-icons/fi'
import { useAuth } from '../auth/AuthContext'
import { addNote } from '../api/notes'
import { listFiles } from '../api/files'
import { listUsers, stepRoleForUser } from '../api/users'
import { forwardFile, addReviewer, assignMaker } from '../api/workflow'
import './Modal.css'

const AddNoteModal = ({ file, onClose, onSaved }) => {
  const { user } = useAuth()
  const [noteContent, setNoteContent] = useState('')
  const [selectedCorr, setSelectedCorr] = useState([])
  const [selectedNotes, setSelectedNotes] = useState([])
  const [isSuoMoto, setIsSuoMoto] = useState(false)
  const [searchApprovedFiles, setSearchApprovedFiles] = useState('')
  const [approvedFilesResults, setApprovedFilesResults] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // Role assignment while creating a note (review #1)
  const [users, setUsers] = useState([])
  const [makerId, setMakerId] = useState(user?.id || '')
  const [checkerIds, setCheckerIds] = useState([])

  // Assigning a chain only makes sense before/at review; not on approved/closed files.
  const canAssign = ['DRAFT', 'SUBMITTED', 'REVERTED', 'UNDER_REVIEW'].includes(file.status)
  const forwardable = ['DRAFT', 'SUBMITTED', 'REVERTED'].includes(file.status)

  useEffect(() => {
    if (!canAssign) return
    listUsers().then(setUsers).catch(() => {})
  }, [canAssign])

  const toggleChecker = (id) => {
    setCheckerIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const applyAssignments = async () => {
    const recipients = checkerIds
      .map((id) => users.find((u) => u.id === id))
      .filter(Boolean)
      .map((u) => ({ userId: u.id, role: stepRoleForUser(u.role) }))

    if (recipients.length) {
      if (forwardable) {
        await forwardFile(file.id, { recipients, remarks: '' })
      } else {
        // eslint-disable-next-line no-restricted-syntax
        for (const r of recipients) {
          // eslint-disable-next-line no-await-in-loop
          await addReviewer(file.id, r)
        }
      }
    } else if (forwardable && makerId && makerId !== user?.id) {
      // No checkers, but a different responsible officer was named → reassign the Maker.
      await assignMaker(file.id, makerId)
    }
  }

  const save = async (isDraft) => {
    if (!noteContent.trim()) {
      setError('Note content is required')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await addNote(file.id, {
        content: noteContent,
        isDraft,
        isSuoMoto,
        references: {
          correspondence: selectedCorr,
          notes: selectedNotes.map((n) => `Note ${n}`),
        },
      })
      // Assignments apply on Submit only (a draft stays with its owner).
      if (!isDraft && canAssign) await applyAssignments()
      onSaved && onSaved()
      onClose()
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    save(false)
  }

  const handleSearchApprovedFiles = async (searchTerm) => {
    setSearchApprovedFiles(searchTerm)
    if (searchTerm.length > 2) {
      try {
        const results = await listFiles({ status: 'APPROVED', search: searchTerm })
        setApprovedFilesResults(results)
      } catch {
        setApprovedFilesResults([])
      }
    } else {
      setApprovedFilesResults([])
    }
  }

  const handleCopyReference = (approvedFile) => {
    const reference = `Refer approved file ${approvedFile.fileNumber}: ${approvedFile.subject}`
    setNoteContent((prev) => (prev ? `${prev}\n${reference}` : reference))
    setSearchApprovedFiles('')
    setApprovedFilesResults([])
  }

  const toggleCorr = (corrNumber) => {
    setSelectedCorr((prev) => (prev.includes(corrNumber) ? prev.filter((c) => c !== corrNumber) : [...prev, corrNumber]))
  }

  const toggleNote = (noteNumber) => {
    setSelectedNotes((prev) => (prev.includes(noteNumber) ? prev.filter((n) => n !== noteNumber) : [...prev, noteNumber]))
  }

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
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Enter your note here. You can reference correspondence (e.g., Refer C/1) or previous notes (e.g., Refer Note 1)..."
              rows={10}
            />
          </div>

          <div className="form-group">
            <label>Search Approved Files</label>
            <div className="search-approved-files">
              <input
                type="text"
                value={searchApprovedFiles}
                onChange={(e) => handleSearchApprovedFiles(e.target.value)}
                placeholder="Search approved files to copy references..."
                className="search-input"
              />
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
            <small>Search and copy references from approved files</small>
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

          {/* Assign Maker & Checker (review #1) */}
          {canAssign && (
            <div className="form-group" style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
              <label style={{ fontWeight: 600 }}>Assign roles (optional)</label>
              <small style={{ display: 'block', marginBottom: 8, color: '#718096' }}>
                Applied when you <strong>Submit</strong> the note. A saved draft stays with you.
              </small>
              <div className="form-row">
                <div className="form-group">
                  <label>Maker (responsible officer)</label>
                  <select value={makerId} onChange={(e) => setMakerId(e.target.value)} disabled={!forwardable}>
                    <option value={user?.id || ''}>{user?.name} (you)</option>
                    {users.filter((u) => u.id !== user?.id).map((u) => (
                      <option key={u.id} value={u.id}>{u.name} — {u.section} ({u.role})</option>
                    ))}
                  </select>
                  {!forwardable && <small>Maker is fixed once the file is under review.</small>}
                </div>
                <div className="form-group">
                  <label>Checker(s){file.status === 'UNDER_REVIEW' ? ' to add' : ''}</label>
                  <div className="reference-list" style={{ maxHeight: 140 }}>
                    {users.filter((u) => u.id !== user?.id && u.role !== 'ADMIN').map((u) => (
                      <label key={u.id} className="reference-item">
                        <input type="checkbox" checked={checkerIds.includes(u.id)} onChange={() => toggleChecker(u.id)} />
                        <span>{u.name} <em style={{ color: '#718096' }}>({stepRoleForUser(u.role)})</em></span>
                      </label>
                    ))}
                    {users.length === 0 && <div className="empty-ref">Loading users…</div>}
                  </div>
                </div>
              </div>
              {checkerIds.length > 0 && (
                <small style={{ color: '#4c51bf' }}>
                  On submit, the file is sent to {checkerIds.length} reviewer(s) in the order selected.
                </small>
              )}
            </div>
          )}

          <div className="form-group">
            <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={isSuoMoto} onChange={(e) => setIsSuoMoto(e.target.checked)} />
              <span>Suo-moto note (internal note with no correspondence)</span>
            </label>
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
