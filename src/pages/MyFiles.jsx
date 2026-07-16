import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiFile, FiSearch, FiFilter, FiEye, FiLoader, FiBookOpen } from 'react-icons/fi'
import { listFiles } from '../api/files'
import { FILE_STATUSES, prettyStatus, statusColor } from '../utils/status'
import './FileList.css'

const MyFiles = () => {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('lastUsed') // 'lastUsed', 'date', 'number'

  useEffect(() => {
    let active = true
    setLoading(true)
    listFiles({ mine: true })
      .then((data) => { if (active) { setFiles(data); setError(null) } })
      .catch((e) => { if (active) setError(e.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const filteredFiles = files.filter((file) => {
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      file.fileNumber.toLowerCase().includes(term) ||
      file.subject.toLowerCase().includes(term) ||
      (file.unNumber && file.unNumber.toLowerCase().includes(term))
    const matchesStatus = statusFilter === 'all' || file.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    if (sortBy === 'lastUsed') {
      return new Date(b.lastUsedDate || b.lastModified) - new Date(a.lastUsedDate || a.lastModified)
    } else if (sortBy === 'date') {
      return new Date(b.createdDate) - new Date(a.createdDate)
    } else if (sortBy === 'number') {
      return a.fileNumber.localeCompare(b.fileNumber)
    }
    return 0
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
        <h1>My Files</h1>
        <Link to="/create-file" className="btn-primary">
          <FiFile /> Create New File
        </Link>
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
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
            <option value="all">All Status</option>
            {FILE_STATUSES.map((s) => (
              <option key={s} value={s}>{prettyStatus(s)}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="filter-select">
            <option value="lastUsed">Last Used Date</option>
            <option value="date">Created Date</option>
            <option value="number">File Number</option>
          </select>
        </div>
      </div>

      <div className="file-list-container">
        {loading ? (
          <div className="empty-state"><FiLoader size={48} /><p>Loading files…</p></div>
        ) : error ? (
          <div className="empty-state"><FiFile size={48} /><p>Couldn’t load files: {error}</p></div>
        ) : sortedFiles.length > 0 ? (
          <div className="file-list">
            {sortedFiles.map((file) => (
              <div key={file.id} className="file-card">
                <div className="file-card-header">
                  <div>
                    <div className="file-number">{file.fileNumber}</div>
                    {file.unNumber && <div className="un-number">UN: {file.unNumber}</div>}
                  </div>
                  <div className="file-badges">
                    {file.priority === 'Urgent' && (
                      <span className="badge priority" style={{ background: getPriorityColor(file.priority) }}>{file.priority}</span>
                    )}
                    {file.confidential && <span className="badge confidential">CONFIDENTIAL</span>}
                    <span className="badge status" style={{ background: statusColor(file.status) }}>{prettyStatus(file.status)}</span>
                  </div>
                </div>
                <div className="file-subject">{file.subject}</div>
                <div className="file-meta">
                  <span className="meta-item"><strong>Section:</strong> {file.section}</span>
                  <span className="meta-item"><strong>Created:</strong> {new Date(file.createdDate).toLocaleDateString()}</span>
                  <span className="meta-item"><strong>Last Modified:</strong> {new Date(file.lastModified).toLocaleDateString()}</span>
                </div>
                <div className="file-actions">
                  <Link to={`/file/${file.id}`} className="btn-view"><FiEye /> View File</Link>
                  <Link to={`/file/${file.id}/read`} className="btn-view" style={{ marginLeft: 8 }}><FiBookOpen /> Read</Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state"><FiFile size={48} /><p>No files found</p></div>
        )}
      </div>
    </div>
  )
}

export default MyFiles
