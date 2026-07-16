import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiFile, FiSearch, FiEye, FiLoader, FiBookOpen } from 'react-icons/fi'
import { listFiles } from '../api/files'
import { prettyStatus, statusColor } from '../utils/status'
import './FileList.css'

const PendingApprovals = () => {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    // Files with a PENDING workflow step assigned to the current user.
    listFiles({ pending: true })
      .then((data) => { if (active) { setFiles(data); setError(null) } })
      .catch((e) => { if (active) setError(e.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const filteredFiles = files.filter((file) => {
    const term = searchTerm.toLowerCase()
    return file.fileNumber.toLowerCase().includes(term) || file.subject.toLowerCase().includes(term)
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
        {loading ? (
          <div className="empty-state"><FiLoader size={48} /><p>Loading…</p></div>
        ) : error ? (
          <div className="empty-state"><FiFile size={48} /><p>Couldn’t load approvals: {error}</p></div>
        ) : filteredFiles.length > 0 ? (
          <div className="file-list">
            {filteredFiles.map((file) => (
              <div key={file.id} className="file-card">
                <div className="file-card-header">
                  <div className="file-number">{file.fileNumber}</div>
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
                  <Link to={`/file/${file.id}`} className="btn-view"><FiEye /> Review File</Link>
                  <Link to={`/file/${file.id}/read`} className="btn-view" style={{ marginLeft: 8 }}><FiBookOpen /> Read</Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state"><FiFile size={48} /><p>No pending approvals</p></div>
        )}
      </div>
    </div>
  )
}

export default PendingApprovals
