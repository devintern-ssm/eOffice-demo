import React, { useState } from 'react'
import { FiX, FiCheck, FiXCircle, FiArrowLeft, FiSend } from 'react-icons/fi'
import { currentUser } from '../data/dummyData'
import './Modal.css'

const ReviewModal = ({ file, onClose }) => {
  const [action, setAction] = useState('')
  const [remarks, setRemarks] = useState('')
  const [forwardTo, setForwardTo] = useState('')
  const [selectedParagraphs, setSelectedParagraphs] = useState([])
  const [mdApprovalFile, setMdApprovalFile] = useState(null)
  const [showMdUpload, setShowMdUpload] = useState(false)
  const [digitalSignature, setDigitalSignature] = useState('')

  const latestNote = file.notes[file.notes.length - 1]

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!action) {
      alert('Please select an action')
      return
    }
    // In real app, this would process the review
    alert(`File ${action.toLowerCase()}! (Demo mode)`)
    onClose()
  }

  const toggleParagraph = (index) => {
    setSelectedParagraphs(prev => 
      prev.includes(index)
        ? prev.filter(p => p !== index)
        : [...prev, index]
    )
  }

  const paragraphs = latestNote.content.split('\n\n').filter(p => p.trim())

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Review & Approve File</h2>
          <button className="modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="modal-body">
          <div className="review-file-info">
            <div className="info-item">
              <strong>File:</strong> {file.fileNumber}
            </div>
            <div className="info-item">
              <strong>Subject:</strong> {file.subject}
            </div>
            <div className="info-item">
              <strong>Current Note:</strong> Note {latestNote.noteNumber}
            </div>
          </div>

          <div className="review-note-preview">
            <h3>Note Content</h3>
            <div className="note-preview">
              {latestNote.content}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Select Action *</label>
              <div className="action-buttons">
                <button
                  type="button"
                  className={`action-btn ${action === 'check' ? 'active' : ''}`}
                  onClick={() => setAction('check')}
                >
                  <FiCheck /> Check
                </button>
                <button
                  type="button"
                  className={`action-btn ${action === 'approve' ? 'active' : ''}`}
                  onClick={() => setAction('approve')}
                >
                  <FiCheck /> Approve
                </button>
                <button
                  type="button"
                  className={`action-btn reject ${action === 'revert' ? 'active' : ''}`}
                  onClick={() => setAction('revert')}
                >
                  <FiArrowLeft /> Revert
                </button>
                <button
                  type="button"
                  className={`action-btn ${action === 'approve-conditional' ? 'active' : ''}`}
                  onClick={() => setAction('approve-conditional')}
                >
                  <FiCheck /> Approve with Conditions
                </button>
                <button
                  type="button"
                  className={`action-btn ${action === 'reject' ? 'active' : ''}`}
                  onClick={() => setAction('reject')}
                >
                  <FiXCircle /> Reject
                </button>
                <button
                  type="button"
                  className={`action-btn ${action === 'clarification' ? 'active' : ''}`}
                  onClick={() => setAction('clarification')}
                >
                  Request Clarification
                </button>
              </div>
              <small>Maker-Checker Workflow: Check (and forward) or Approve (and return) or Revert (to maker)</small>
            </div>

            {action === 'approve-conditional' && (
              <div className="form-group">
                <label>Select Paragraphs for Approval</label>
                <div className="paragraphs-list">
                  {paragraphs.map((para, index) => (
                    <label key={index} className="paragraph-item">
                      <input
                        type="checkbox"
                        checked={selectedParagraphs.includes(index)}
                        onChange={() => toggleParagraph(index)}
                      />
                      <div className="paragraph-text">
                        Paragraph {String.fromCharCode(65 + index)}: {para.substring(0, 100)}...
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Remarks/Comments *</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter your remarks, observations, or instructions. Multiple checkers can add comments sequentially..."
                rows={6}
                required
              />
              <small>Each checker can add their comments. Comments are added sequentially.</small>
            </div>

            <div className="form-group">
              <label>MD Approval (Offline)</label>
              <div className="md-approval-section">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowMdUpload(!showMdUpload)}
                >
                  {showMdUpload ? 'Hide' : 'Upload Offline MD Approval'}
                </button>
                {showMdUpload && (
                  <div className="md-upload-area">
                    <input
                      type="file"
                      id="md-approval-upload"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setMdApprovalFile(e.target.files[0])
                        }
                      }}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="md-approval-upload" className="file-upload-label">
                      <FiUpload />
                      {mdApprovalFile ? (
                        <span>{mdApprovalFile.name}</span>
                      ) : (
                        <span>Upload scanned MD approval</span>
                      )}
                    </label>
                    <small>Any maker or checker can upload physical scanned approval</small>
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Digital Signature</label>
              <input
                type="text"
                value={digitalSignature}
                onChange={(e) => setDigitalSignature(e.target.value)}
                placeholder="Enter digital signature or select certificate..."
              />
              <small>Digital signature (if required/approved by)</small>
            </div>

            {action === 'approve' && (
              <div className="form-group">
                <label>Forward To (Optional)</label>
                <input
                  type="text"
                  value={forwardTo}
                  onChange={(e) => setForwardTo(e.target.value)}
                  placeholder="Select next recipient..."
                />
                <small>Leave empty if this is final approval</small>
              </div>
            )}

            <div className="form-group">
              <label>Reviewer</label>
              <div className="author-display">
                {currentUser.name} - {currentUser.designation}
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                <FiSend /> Submit Review
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ReviewModal
