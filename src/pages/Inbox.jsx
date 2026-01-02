import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiFile, FiSearch, FiFilter, FiEye } from 'react-icons/fi'
import { files, currentUser } from '../data/dummyData'
import './FileList.css'

const Inbox = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const inboxFiles = files.filter(f => f.currentAssignee === currentUser.id)

  const filteredFiles = inboxFiles.filter(file => {
    const matchesSearch = 
      file.fileNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.subject.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || file.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return '#48bb78'
      case 'Under Review': return '#ed8936'
      case 'Approved': return '#38b2ac'
      case 'Closed': return '#718096'
      default: return '#a0aec0'
    }
  }

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
        <h1>Inbox</h1>
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
        <div className="filter-group">
          <FiFilter className="filter-icon" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="Open">Open</option>
            <option value="Under Review">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="Closed">Closed</option>
          </select>
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
                    <span className="badge status" style={{ background: getStatusColor(file.status) }}>
                      {file.status}
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
                    <FiEye /> View File
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <FiFile size={48} />
            <p>No files in inbox</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Inbox
