import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiFile, FiSearch, FiFilter, FiEye } from 'react-icons/fi'
import { files } from '../data/dummyData'
import './FileList.css'

const AllFiles = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sectionFilter, setSectionFilter] = useState('all')

  const sections = ['Administration', 'Accounts', 'Legal', 'Audit', 'Finance', 'Engineering']

  const filteredFiles = files.filter(file => {
    const matchesSearch = 
      file.fileNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.subject.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || file.status === statusFilter
    const matchesSection = sectionFilter === 'all' || file.section === sectionFilter
    return matchesSearch && matchesStatus && matchesSection
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

  return (
    <div className="file-list-page">
      <div className="page-header">
        <h1>All Files</h1>
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
        <div className="filter-group">
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Sections</option>
            {sections.map(section => (
              <option key={section} value={section}>{section}</option>
            ))}
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
            <p>No files found</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AllFiles
