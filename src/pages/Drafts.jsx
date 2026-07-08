import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiFile, FiEye, FiLoader, FiEdit } from 'react-icons/fi'
import { listFiles } from '../api/files'
import { prettyStatus, statusColor } from '../utils/status'
import './FileList.css'

/** Draft files & files where I have a draft note (review #8 — Drafts sidebar entry). */
const Drafts = () => {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    listFiles({ draft: true })
      .then((data) => { if (active) { setFiles(data); setError(null) } })
      .catch((e) => { if (active) setError(e.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  return (
    <div className="file-list-page">
      <div className="page-header">
        <h1><FiEdit style={{ verticalAlign: '-3px' }} /> Drafts</h1>
        <Link to="/create-file" className="btn-primary"><FiFile /> Create New File</Link>
      </div>

      <p style={{ color: '#718096', margin: '0 0 16px' }}>
        Your draft files and files that still contain a draft note of yours.
      </p>

      <div className="file-list-container">
        {loading ? (
          <div className="empty-state"><FiLoader size={48} /><p>Loading drafts…</p></div>
        ) : error ? (
          <div className="empty-state"><FiFile size={48} /><p>Couldn’t load drafts: {error}</p></div>
        ) : files.length > 0 ? (
          <div className="file-list">
            {files.map((file) => (
              <div key={file.id} className="file-card">
                <div className="file-card-header">
                  <div>
                    <div className="file-number">{file.fileNumber}</div>
                    {file.unNumber && <div className="un-number">UN: {file.unNumber}</div>}
                  </div>
                  <div className="file-badges">
                    {file.confidential && <span className="badge confidential">CONFIDENTIAL</span>}
                    <span className="badge status" style={{ background: statusColor(file.status) }}>{prettyStatus(file.status)}</span>
                  </div>
                </div>
                <div className="file-subject">{file.subject}</div>
                <div className="file-meta">
                  <span className="meta-item"><strong>Section:</strong> {file.section}</span>
                  <span className="meta-item"><strong>Created:</strong> {new Date(file.createdDate).toLocaleDateString()}</span>
                </div>
                <div className="file-actions">
                  <Link to={`/file/${file.id}`} className="btn-view"><FiEye /> Open Draft</Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state"><FiEdit size={48} /><p>No drafts right now</p></div>
        )}
      </div>
    </div>
  )
}

export default Drafts
