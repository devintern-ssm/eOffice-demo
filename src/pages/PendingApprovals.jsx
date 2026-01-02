import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiFile, FiSearch, FiFilter, FiEye } from 'react-icons/fi'
import { files } from '../data/dummyData'
import './FileList.css'

const PendingApprovals = () => {
  const [searchTerm, setSearchTerm] = useState('')

  const pendingFiles = files.filter(f => f.status === 'Under Review')

  const filteredFiles = pendingFiles.filter(file => {
    return file.fileNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.subject.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent': return '#f56565'
      case 'High': return '#ed8936'
      default: return '#718096'
    }
  }

  return (
    <div className="file-list-page">
      <div className="page-header">
        <h1>Pending Approvals</h1>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by file number or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="file-list-container">
        {filteredFiles.length > 0 ? (
          <div className="file-list">
            {filteredFiles.map(file => (
              <div key={file.id} className="file-card">
                <div className="file-card-header">
                  <div className="file-number">{file.fileNumber}</div>
                  <div className="file-badges">
                    {file.priority === 'Urgent' && (
                      <span className="badge priority" style={{ background: getPriorityColor(file.priority) }}>
                        {file.priority}
                      </span>
                    )}
                    {file.confidential && (
                      <span className="badge confidential">CONFIDENTIAL</span>
                    )}
                    <span className="badge status" style={{ background: '#ed8936' }}>
                      Under Review
                    </span>
                  </div>
                </div>
                <div className="file-subject">{file.subject}</div>
                <div className="file-meta">
                  <span className="meta-item">
                    <strong>Section:</strong> {file.section}
                  </span>
                  <span className="meta-item">
                    <strong>Created:</strong> {new Date(file.createdDate).toLocaleDateString()}
                  </span>
                  <span className="meta-item">
                    <strong>Last Modified:</strong> {new Date(file.lastModified).toLocaleDateString()}
                  </span>
                </div>
                <div className="file-actions">
                  <Link to={`/file/${file.id}`} className="btn-view">
                    <FiEye /> Review File
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <FiFile size={48} />
            <p>No pending approvals</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default PendingApprovals
