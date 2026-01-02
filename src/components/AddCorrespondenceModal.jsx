import React, { useState } from 'react'
import { FiX, FiUpload, FiFile } from 'react-icons/fi'
import './Modal.css'

const AddCorrespondenceModal = ({ file, onClose }) => {
  const [documentType, setDocumentType] = useState('Letter')
  const [title, setTitle] = useState('')
  const [inwardDate, setInwardDate] = useState('')
  const [inwardNumber, setInwardNumber] = useState('')
  const [fileUpload, setFileUpload] = useState(null)

  const nextCorrNumber = `C/${file.correspondence.length + 1}`

  const documentTypes = [
    'Letter',
    'Bill',
    'Voucher',
    'Order',
    'Circular',
    'Report',
    'Court Order',
    'Representation',
    'Other'
  ]

  const handleSubmit = (e) => {
    e.preventDefault()
    // In real app, this would upload the file
    alert(`Correspondence ${nextCorrNumber} added successfully! (Demo mode)`)
    onClose()
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFileUpload(e.target.files[0])
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Correspondence</h2>
          <button className="modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Correspondence Number</label>
            <div className="corr-number-display">
              {nextCorrNumber}
            </div>
            <small>Auto-generated</small>
          </div>

          <div className="form-group">
            <label>Document Type *</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              required
            >
              {documentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Title/Description *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter document title or description..."
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Inward Date</label>
              <input
                type="date"
                value={inwardDate}
                onChange={(e) => setInwardDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Inward Number</label>
              <input
                type="text"
                value={inwardNumber}
                onChange={(e) => setInwardNumber(e.target.value)}
                placeholder="e.g., IN/2024/045"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Upload Document *</label>
            <div className="file-upload-area">
              <input
                type="file"
                id="file-upload"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                required
              />
              <label htmlFor="file-upload" className="file-upload-label">
                <FiUpload className="upload-icon" />
                {fileUpload ? (
                  <div className="file-selected">
                    <FiFile />
                    <span>{fileUpload.name}</span>
                  </div>
                ) : (
                  <div>
                    <div>Click to upload or drag and drop</div>
                    <small>PDF, DOC, DOCX, JPG, PNG (Max 10MB)</small>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <FiUpload /> Upload Correspondence
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddCorrespondenceModal
