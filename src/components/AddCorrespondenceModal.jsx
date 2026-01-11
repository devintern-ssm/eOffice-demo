import React, { useState } from 'react'
import { FiX, FiUpload, FiFile } from 'react-icons/fi'
import './Modal.css'

const AddCorrespondenceModal = ({ file, onClose }) => {
  const [documentType, setDocumentType] = useState('Letter')
  const [title, setTitle] = useState('')
  const [inwardDate, setInwardDate] = useState('')
  const [inwardNumber, setInwardNumber] = useState('')
  const [fileUpload, setFileUpload] = useState(null)
  const [emailReference, setEmailReference] = useState('')
  const [pageRange, setPageRange] = useState('')
  const [isEmailAttachment, setIsEmailAttachment] = useState(false)

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
    'Email',
    'Other'
  ]

  const supportedFormats = [
    'PDF', 'Excel (.xlsx, .xls)', 'Word (.docx, .doc)', 
    'JPG/JPEG', 'PNG', 'All printable formats'
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
            <label>Upload Type</label>
            <div className="upload-type-selector">
              <label className="radio-label">
                <input
                  type="radio"
                  name="uploadType"
                  value="file"
                  checked={!isEmailAttachment}
                  onChange={() => setIsEmailAttachment(false)}
                />
                <span>File Upload</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="uploadType"
                  value="email"
                  checked={isEmailAttachment}
                  onChange={() => setIsEmailAttachment(true)}
                />
                <span>Email Reference</span>
              </label>
            </div>
          </div>

          {!isEmailAttachment ? (
            <>
              <div className="form-group">
                <label>Upload Document *</label>
                <div 
                  className="file-upload-area"
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.currentTarget.classList.add('drag-over')
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.classList.remove('drag-over')
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    e.currentTarget.classList.remove('drag-over')
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      setFileUpload(e.dataTransfer.files[0])
                    }
                  }}
                >
                  <input
                    type="file"
                    id="file-upload"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    style={{ display: 'none' }}
                    required={!isEmailAttachment}
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
                        <div>Click to upload or <strong>drag and drop</strong> files here</div>
                        <small>Supported: {supportedFormats.join(', ')} (Max 10MB)</small>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Page Range (Optional)</label>
                <input
                  type="text"
                  value={pageRange}
                  onChange={(e) => setPageRange(e.target.value)}
                  placeholder="e.g., 5-10 or 5 (for single page)"
                />
                <small>For large documents, specify page range (e.g., if C/36 is on page 5, enter "5")</small>
              </div>
            </>
          ) : (
            <div className="form-group">
              <label>Email Reference *</label>
              <input
                type="text"
                value={emailReference}
                onChange={(e) => setEmailReference(e.target.value)}
                placeholder="Enter email subject or reference..."
                required={isEmailAttachment}
              />
              <small>Add email reference to correspondence side</small>
            </div>
          )}

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
