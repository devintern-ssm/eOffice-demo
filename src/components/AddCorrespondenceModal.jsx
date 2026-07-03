import React, { useState } from 'react'
import { FiX, FiUpload, FiFile } from 'react-icons/fi'
import { addCorrespondence } from '../api/correspondence'
import './Modal.css'

const AddCorrespondenceModal = ({ file, onClose, onSaved }) => {
  const [documentType, setDocumentType] = useState('Letter')
  const [title, setTitle] = useState('')
  const [inwardDate, setInwardDate] = useState('')
  const [inwardNumber, setInwardNumber] = useState('')
  const [fileUpload, setFileUpload] = useState(null)
  const [emailReference, setEmailReference] = useState('')
  const [isEmailAttachment, setIsEmailAttachment] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const nextCorrNumber = `C/${file.correspondence.length + 1}`

  const documentTypes = ['Letter', 'Bill', 'Voucher', 'Order', 'Circular', 'Report', 'Court Order', 'Representation', 'Email', 'Other']

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!isEmailAttachment) {
      if (!fileUpload) { setError('Please choose a PDF file'); return }
      if (fileUpload.type !== 'application/pdf') { setError('Phase 1 supports PDF files only'); return }
    } else if (!emailReference.trim()) {
      setError('Please enter an email reference')
      return
    }
    setSubmitting(true)
    try {
      await addCorrespondence(file.id, {
        type: isEmailAttachment ? 'Email' : documentType,
        title: title || (isEmailAttachment ? emailReference : fileUpload?.name) || 'Untitled',
        inwardDate: inwardDate || undefined,
        inwardNumber: inwardNumber || undefined,
        emailReference: isEmailAttachment ? emailReference : undefined,
        file: isEmailAttachment ? undefined : fileUpload,
      })
      onSaved && onSaved()
      onClose()
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) setFileUpload(e.target.files[0])
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Correspondence</h2>
          <button className="modal-close" onClick={onClose}><FiX /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Correspondence Number</label>
            <div className="corr-number-display">{nextCorrNumber}</div>
            <small>Auto-generated</small>
          </div>

          <div className="form-group">
            <label>Document Type *</label>
            <select value={documentType} onChange={(e) => setDocumentType(e.target.value)} required>
              {documentTypes.map((type) => (<option key={type} value={type}>{type}</option>))}
            </select>
          </div>

          <div className="form-group">
            <label>Title/Description *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter document title or description..." required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Inward Date</label>
              <input type="date" value={inwardDate} onChange={(e) => setInwardDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Inward Number</label>
              <input type="text" value={inwardNumber} onChange={(e) => setInwardNumber(e.target.value)} placeholder="e.g., IN/2024/045" />
            </div>
          </div>

          <div className="form-group">
            <label>Upload Type</label>
            <div className="upload-type-selector">
              <label className="radio-label">
                <input type="radio" name="uploadType" checked={!isEmailAttachment} onChange={() => setIsEmailAttachment(false)} />
                <span>PDF Upload</span>
              </label>
              <label className="radio-label">
                <input type="radio" name="uploadType" checked={isEmailAttachment} onChange={() => setIsEmailAttachment(true)} />
                <span>Email Reference</span>
              </label>
            </div>
          </div>

          {!isEmailAttachment ? (
            <div className="form-group">
              <label>Upload Document (PDF) *</label>
              <div
                className="file-upload-area"
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over') }}
                onDragLeave={(e) => { e.currentTarget.classList.remove('drag-over') }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.currentTarget.classList.remove('drag-over')
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) setFileUpload(e.dataTransfer.files[0])
                }}
              >
                <input type="file" id="file-upload" onChange={handleFileChange} accept="application/pdf,.pdf" style={{ display: 'none' }} />
                <label htmlFor="file-upload" className="file-upload-label">
                  <FiUpload className="upload-icon" />
                  {fileUpload ? (
                    <div className="file-selected"><FiFile /><span>{fileUpload.name}</span></div>
                  ) : (
                    <div>
                      <div>Click to upload or <strong>drag and drop</strong> a PDF here</div>
                      <small>PDF only (max 10MB). Other formats arrive in Phase 2.</small>
                    </div>
                  )}
                </label>
              </div>
            </div>
          ) : (
            <div className="form-group">
              <label>Email Reference *</label>
              <input type="text" value={emailReference} onChange={(e) => setEmailReference(e.target.value)} placeholder="Enter email subject or reference..." />
              <small>Adds the email as a correspondence entry (no PDF).</small>
            </div>
          )}

          {error && <div className="form-error" style={{ color: '#e53e3e', marginBottom: 12 }}>{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              <FiUpload /> {submitting ? 'Uploading…' : 'Upload Correspondence'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddCorrespondenceModal
