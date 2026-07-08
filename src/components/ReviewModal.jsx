import React, { useState } from 'react'
import { FiX, FiCheck, FiXCircle, FiArrowLeft, FiSend, FiHelpCircle } from 'react-icons/fi'
import { actOnFile } from '../api/workflow'
import './Modal.css'

const ACTIONS = [
  { key: 'check', label: 'Check', icon: FiCheck, cls: '' },
  { key: 'approve', label: 'Approve', icon: FiCheck, cls: '' },
  { key: 'revert', label: 'Revert', icon: FiArrowLeft, cls: 'reject' },
  { key: 'reject', label: 'Reject', icon: FiXCircle, cls: 'reject' },
  { key: 'clarify', label: 'Request Clarification', icon: FiHelpCircle, cls: '' },
]

const ReviewModal = ({ file, onClose, onSaved }) => {
  const [action, setAction] = useState('')
  const [remarks, setRemarks] = useState('')
  const [dept, setDept] = useState('')
  const [signatureName, setSignatureName] = useState('')
  const [paragraphs, setParagraphs] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const latestNote = file.notes && file.notes.length ? file.notes[file.notes.length - 1] : null
  const currentStep = (file.steps || []).find((s) => s.status === 'PENDING')
  const paraList = latestNote ? latestNote.content.split('\n\n').map((p) => p.trim()).filter(Boolean) : []
  const showParagraphs = action === 'approve' || action === 'check'
  const toggleParagraph = (mark) => setParagraphs((prev) => (prev.includes(mark) ? prev.filter((m) => m !== mark) : [...prev, mark]))

  const requiresRemarks = ['revert', 'reject', 'clarify'].includes(action)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!action) { setError('Select an action'); return }
    if (requiresRemarks && !remarks.trim()) { setError('Please add a remark explaining the revert/rejection'); return }
    setSubmitting(true)
    setError(null)
    try {
      await actOnFile(file.id, { action, remarks, dept, signatureName, paragraphs: showParagraphs ? paragraphs : undefined })
      onSaved && onSaved()
      onClose()
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Review &amp; Approve File</h2>
          <button className="modal-close" onClick={onClose}><FiX /></button>
        </div>

        <div className="modal-body">
          <div className="review-file-info">
            <div className="info-item"><strong>File:</strong> {file.fileNumber}</div>
            <div className="info-item"><strong>Subject:</strong> {file.subject}</div>
            <div className="info-item">
              <strong>Your step:</strong>{' '}
              {currentStep ? `Step ${currentStep.stepOrder} — ${currentStep.assigneeName} (${currentStep.roleAtStep})` : 'No pending step'}
            </div>
          </div>

          {latestNote && (
            <div className="review-note-preview">
              <h3>Latest note (Note {latestNote.noteNumber})</h3>
              <div className="note-preview">{latestNote.content}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Select Action *</label>
              <div className="action-buttons">
                {ACTIONS.map((a) => {
                  const Icon = a.icon
                  return (
                    <button
                      type="button"
                      key={a.key}
                      className={`action-btn ${a.cls} ${action === a.key ? 'active' : ''}`}
                      onClick={() => setAction(a.key)}
                    >
                      <Icon /> {a.label}
                    </button>
                  )
                })}
              </div>
              <small>Check (forward to next) · Approve (advance / final approve) · Revert / Reject / Clarify (back to originator)</small>
            </div>

            {showParagraphs && paraList.length > 1 && (
              <div className="form-group">
                <label>Approve specific paragraphs (optional)</label>
                <div className="paragraphs-list">
                  {paraList.map((para, index) => {
                    const mark = String.fromCharCode(65 + index)
                    return (
                      <label key={index} className="paragraph-item" style={{ display: 'flex', gap: 8, alignItems: 'flex-start', margin: '4px 0' }}>
                        <input type="checkbox" checked={paragraphs.includes(mark)} onChange={() => toggleParagraph(mark)} />
                        <span><strong>{mark}:</strong> {para.slice(0, 90)}{para.length > 90 ? '…' : ''}</span>
                      </label>
                    )
                  })}
                </div>
                <small>Leave unchecked to approve the whole note.</small>
              </div>
            )}

            <div className="form-group">
              <label>Remarks / Comments {requiresRemarks ? '*' : ''}</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Your remarks are recorded on the noting side and stamped with your name, department and time."
                rows={5}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Department</label>
                <input type="text" value={dept} onChange={(e) => setDept(e.target.value)} placeholder="Defaults to your section" />
                <small>Recorded with the action (date &amp; time stamped automatically).</small>
              </div>
              <div className="form-group">
                <label>Signature (typed)</label>
                <input type="text" value={signatureName} onChange={(e) => setSignatureName(e.target.value)} placeholder="Defaults to your name" />
                <small>Typed-name signature (Phase 1). Left blank = your account name.</small>
              </div>
            </div>

            {error && <div className="form-error" style={{ color: '#e53e3e', marginBottom: 12 }}>{error}</div>}

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                <FiSend /> {submitting ? 'Submitting…' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ReviewModal
