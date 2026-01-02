import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiFile, FiX, FiSave } from 'react-icons/fi'
import { sections } from '../data/dummyData'
import './CreateFile.css'

const CreateFile = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    fileNumber: '',
    section: '',
    subject: '',
    startPeriod: '',
    fileType: 'Regular',
    initialNote: '',
    confidential: false
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    // In real app, this would create the file
    alert('File created successfully! (Demo mode)')
    navigate('/my-files')
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  return (
    <div className="create-file-page">
      <div className="create-file-container">
        <div className="page-header">
          <h1>Create New File</h1>
          <button className="btn-secondary" onClick={() => navigate(-1)}>
            <FiX /> Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-file-form">
          <div className="form-section">
            <h2>File Details</h2>
            
            <div className="form-group">
              <label>File Number *</label>
              <input
                type="text"
                name="fileNumber"
                value={formData.fileNumber}
                onChange={handleChange}
                placeholder="e.g., ADMIN/2024/001"
                required
              />
              <small>Enter unique file number</small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Section/Department *</label>
                <select
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Section</option>
                  {sections.map(section => (
                    <option key={section} value={section}>{section}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>File Type</label>
                <select
                  name="fileType"
                  value={formData.fileType}
                  onChange={handleChange}
                >
                  <option value="Regular">Regular</option>
                  <option value="Confidential">Confidential</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Subject *</label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Enter file subject..."
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Start Period</label>
                <input
                  type="date"
                  name="startPeriod"
                  value={formData.startPeriod}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>End Period</label>
                <input
                  type="date"
                  name="endPeriod"
                  value={formData.endPeriod || ''}
                  onChange={handleChange}
                />
                <small>Optional</small>
              </div>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="confidential"
                  checked={formData.confidential}
                  onChange={handleChange}
                />
                <span>Mark as Confidential</span>
              </label>
            </div>
          </div>

          <div className="form-section">
            <h2>Initial Content (Optional)</h2>
            
            <div className="form-group">
              <label>Initial Note</label>
              <textarea
                name="initialNote"
                value={formData.initialNote}
                onChange={handleChange}
                placeholder="You can add an initial note here, or add it later..."
                rows={8}
              />
            </div>

            <div className="form-group">
              <label>Initial Correspondence</label>
              <div className="file-upload-area">
                <input
                  type="file"
                  id="initial-correspondence"
                  style={{ display: 'none' }}
                />
                <label htmlFor="initial-correspondence" className="file-upload-label">
                  <FiFile className="upload-icon" />
                  <div>
                    <div>Click to upload or drag and drop</div>
                    <small>You can also add correspondence later</small>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <FiSave /> Create File
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateFile
