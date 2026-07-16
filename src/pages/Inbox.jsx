import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiFile, FiSearch, FiFilter, FiEye, FiLoader, FiBookOpen } from 'react-icons/fi'
import { listFiles } from '../api/files'
import { FILE_STATUSES, prettyStatus, statusColor } from '../utils/status'
import './FileList.css'

const Inbox = () => {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [inboxTypeFilter, setInboxTypeFilter] = useState('all') // 'all', 'Inward', 'Outward'

  useEffect(() => {
    let active = true
    setLoading(true)
    listFiles({ holder: true })
      .then((data) => { if (active) { setFiles(data); setError(null) } })
      .catch((e) => { if (active) setError(e.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const isOutward = (f) => f.inboxType === 'Outward'
  const inwardCount = files.filter((f) => !isOutward(f)).length
  const outwardCount = files.filter((f) => isOutward(f)).length

  const filteredFiles = files.filter((file) => {
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      file.fileNumber.toLowerCase().includes(term) ||
      file.subject.toLowerCase().includes(term) ||
      (file.unNumber && file.unNumber.toLowerCase().includes(term))
    const matchesStatus = statusFilter === 'all' || file.status === statusFilter
    const matchesInboxType = inboxTypeFilter === 'all'
      || (inboxTypeFilter === 'Outward' ? isOutward(file) : !isOutward(file))
    return matchesSearch && matchesStatus && matchesInboxType
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
        <h1>Inbox</h1>
      </div>

      {/* Inward / Outward sections */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {[
          { id: 'all', label: 'All', count: files.length, hint: 'Everything currently with you' },
          { id: 'Inward', label: 'Inward', count: inwardCount, hint: 'Received for your action' },
          { id: 'Outward', label: 'Outward', count: outwardCount, hint: 'Your notes sent back for rework' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setInboxTypeFilter(t.id)}
            title={t.hint}
            style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid #cbd5e0', cursor: 'pointer', fontWeight: 600,
              background: inboxTypeFilter === t.id ? '#4c51bf' : '#fff', color: inboxTypeFilter === t.id ? '#fff' : '#4a5568',
            }}
          >
            {t.label} <span style={{ opacity: 0.85 }}>({t.count})</span>
          </button>
        ))}
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
      </div>

      <div className="file-list-container">
        {loading ? (
          <div className="empty-state"><FiLoader size={48} /><p>Loading inbox…</p></div>
        ) : error ? (
          <div className="empty-state"><FiFile size={48} /><p>Couldn’t load inbox: {error}</p></div>
        ) : filteredFiles.length > 0 ? (
          <div className="file-list">
            {filteredFiles.map((file) => (
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
                    {file.inboxType && (
                      <span className={`badge inbox-type ${file.inboxType === 'Inward' ? 'inward' : 'outward'}`}>{file.inboxType}</span>
                    )}
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
          <div className="empty-state"><FiFile size={48} /><p>No files in inbox</p></div>
        )}
      </div>
    </div>
  )
}

export default Inbox
