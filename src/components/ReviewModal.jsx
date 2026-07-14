import React, { useState } from 'react'
import { FiX, FiCheck, FiCornerUpLeft, FiSend } from 'react-icons/fi'
import { signNote, returnNote } from '../api/workflow'
import './Modal.css'

/**
 * Act on the in-flight note as its current signer — two actions only:
 *  • Sign & forward (advance the chain; the last signer finalizes the note)
 *  • Send back (return the note to its maker for correction)
 */
const ReviewModal = ({ file, onClose, onSaved }) => {
  const [action, setAction] = useState('sign') // 'sign' | 'return'
  const [remarks, setRemarks] = useState('')
  const [dept, setDept] = useState('')
  const [signatureName, setSignatureName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const activeNote = (file.notes || []).find((n) => n.status === 'IN_REVIEW')
  const steps = file.steps || []
  const currentStep = steps.find((s) => s.status === 'PENDING')
  const isLast = currentStep && !steps.some((s) => s.stepOrder > currentStep.stepOrder && s.status === 'PENDING')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (action === 'return' && !remarks.trim()) { setError('Please add a remark explaining why the note is sent back'); return }
    setSubmitting(true)
    setError(null)
    try {
      if (action === 'sign') await signNote(file.id, { remarks, dept, signatureName })
      else await returnNote(file.id, { remarks })
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
          <h2>Sign the Note</h2>
          <button className="modal-close" onClick={onClose}><FiX /></button>
        </div>

        <div className="modal-body">
          <div className="review-file-info">
            <div className="info-item"><strong>File:</strong> {file.fileNumber}</div>
            <div className="info-item"><strong>Subject:</strong> {file.subject}</div>
            <div className="info-item">
              <strong>Your step:</strong>{' '}
              {currentStep
                ? `${currentStep.signerName} (${currentStep.roleLabel})${isLast ? ' — final signer, signing finalizes this note' : ''}`
                : 'This note is not awaiting your signature'}
            </div>
          </div>

          {activeNote && (
            <div className="review-note-preview">
              <h3>Note {activeNote.noteNumber}</h3>
              <div className="note-preview">{activeNote.content}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Action *</label>
              <div className="action-buttons">
                <button type="button" className={`action-btn ${action === 'sign' ? 'active' : ''}`} onClick={() => setAction('sign')}>
                  <FiCheck /> {isLast ? 'Sign & Finalize' : 'Sign & Forward'}
                </button>
                <button type="button" className={`action-btn reject ${action === 'return' ? 'active' : ''}`} onClick={() => setAction('return')}>
                  <FiCornerUpLeft /> Send Back
                </button>
              </div>
              <small>
                {action === 'sign'
                  ? (isLast ? 'You are the last signer — signing finalizes the note and returns the file to its maker.' : 'Signs your step and forwards the file to the next signer.')
                  : 'Returns the note to its maker for correction.'}
              </small>
            </div>

            <div className="form-group">
              <label>Remarks {action === 'return' ? '*' : ''}</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Recorded against your signature on this note and stamped with your name, department and time."
                rows={4}
              />
            </div>

            {action === 'sign' && (
              <div className="form-row">
                <div className="form-group">
                  <label>Department</label>
                  <input type="text" value={dept} onChange={(e) => setDept(e.target.value)} placeholder="Defaults to your section" />
                </div>
                <div className="form-group">
                  <label>Signature (typed)</label>
                  <input type="text" value={signatureName} onChange={(e) => setSignatureName(e.target.value)} placeholder="Defaults to your name" />
                </div>
              </div>
            )}

            {error && <div className="form-error" style={{ color: '#e53e3e', marginBottom: 12 }}>{error}</div>}

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={submitting || !currentStep}>
                <FiSend /> {submitting ? 'Submitting…' : action === 'sign' ? (isLast ? 'Sign & Finalize' : 'Sign & Forward') : 'Send Back'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ReviewModal
