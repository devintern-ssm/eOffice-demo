import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiFile, FiInbox, FiCheckCircle, FiSend, FiPlus, FiLayers, FiArchive, FiSearch, FiX } from 'react-icons/fi'
import { getStats, listFiles, getFile } from '../api/files'
import { useAuth } from '../auth/AuthContext'
import { prettyStatus } from '../utils/status'
import AddNoteModal from '../components/AddNoteModal'
import './Dashboard.css'

const Dashboard = () => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const [stats, setStats] = useState({})
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  // "Add Note to any file" flow
  const [showPicker, setShowPicker] = useState(false)
  const [pickerFiles, setPickerFiles] = useState([])
  const [pickerSearch, setPickerSearch] = useState('')
  const [pickerLoading, setPickerLoading] = useState(false)
  const [noteFile, setNoteFile] = useState(null) // loaded file for the Open-Note modal

  const loadStats = () => getStats()
    .then((data) => { setStats(data.stats || {}); setRecentActivity(data.recentActivity || []) })
    .catch(() => {})
    .finally(() => setLoading(false))

  useEffect(() => { let active = true; getStats().then((d) => { if (!active) return; setStats(d.stats || {}); setRecentActivity(d.recentActivity || []) }).catch(() => {}).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [])

  const openPicker = async () => {
    setShowPicker(true); setPickerLoading(true)
    try {
      const files = await listFiles({})
      // Only OPEN binders with no note currently in flight can take a new note.
      setPickerFiles(files.filter((f) => f.status === 'OPEN' && !f.activeNoteNumber))
    } catch { setPickerFiles([]) } finally { setPickerLoading(false) }
  }

  const pickFile = async (id) => {
    try { const f = await getFile(id); setNoteFile(f); setShowPicker(false) } catch (e) { alert(e.message) }
  }

  const filteredPicker = pickerFiles.filter((f) => {
    const t = pickerSearch.toLowerCase()
    return f.fileNumber.toLowerCase().includes(t) || f.subject.toLowerCase().includes(t)
  })

  const cards = isAdmin ? [
    { label: 'Total Files', value: stats.totalFiles ?? 0, icon: FiLayers, color: '#667eea', link: '/reports' },
    { label: 'Open Files', value: stats.openFiles ?? 0, icon: FiFile, color: '#48bb78', link: '/all-files' },
    { label: 'Notes In Review', value: stats.notesInReview ?? 0, icon: FiSend, color: '#ed8936', link: '/all-files' },
    { label: 'Closed Files', value: stats.closedFiles ?? 0, icon: FiArchive, color: '#805ad5', link: '/all-files' },
  ] : [
    { label: 'In My Inbox', value: stats.inboxCount ?? 0, icon: FiInbox, color: '#667eea', link: '/inbox' },
    { label: 'Files I Created', value: stats.filesCreated ?? 0, icon: FiFile, color: '#48bb78', link: '/my-files' },
    { label: 'Awaiting My Signature', value: stats.pendingMyAction ?? 0, icon: FiCheckCircle, color: '#ed8936', link: '/pending-approvals' },
    { label: 'My Notes In Review', value: stats.notesInReview ?? 0, icon: FiSend, color: '#805ad5', link: '/sent-files' },
  ]

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>{isAdmin ? 'Super Admin Dashboard' : 'Dashboard'}</h1>
        {!isAdmin && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" onClick={openPicker}><FiPlus /> Add Note</button>
            <Link to="/create-file" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><FiFile /> New File</Link>
          </div>
        )}
      </div>

      <div className="stats-grid">
        {cards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Link key={index} to={stat.link} className="stat-card">
              <div className="stat-icon" style={{ background: `${stat.color}20`, color: stat.color }}><Icon /></div>
              <div className="stat-content">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="dashboard-section">
        <h2>Recent Activity</h2>
        <div className="activity-list">
          {loading ? (
            <div className="empty-state">Loading…</div>
          ) : recentActivity.length > 0 ? (
            recentActivity.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon"><FiFile /></div>
                <div className="activity-content">
                  <div className="activity-title">
                    <Link to={`/file/${activity.fileId}`} className="file-link">{activity.fileNumber}</Link>
                    <span className="activity-action">{prettyStatus(activity.type)}</span>
                  </div>
                  <div className="activity-subject">{activity.fileSubject}</div>
                  <div className="activity-meta">
                    {activity.actorName}{activity.remarks ? ` — ${activity.remarks}` : ''}
                    <span className="activity-date">{new Date(activity.date).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">No recent activity</div>
          )}
        </div>
      </div>

      {/* File picker for "Add Note to any file" */}
      {showPicker && (
        <div className="modal-overlay" onClick={() => setShowPicker(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, width: 'min(560px, 92vw)', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid #edf2f7' }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>Add a note — choose a file</h2>
              <button onClick={() => setShowPicker(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18 }}><FiX /></button>
            </div>
            <div style={{ padding: '12px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #cbd5e0', borderRadius: 8, padding: '6px 10px' }}>
                <FiSearch color="#718096" />
                <input autoFocus type="text" placeholder="Search by UN number or subject…" value={pickerSearch} onChange={(e) => setPickerSearch(e.target.value)} style={{ flex: 1, border: 'none', outline: 'none' }} />
              </div>
            </div>
            <div style={{ overflow: 'auto', padding: '0 18px 16px' }}>
              {pickerLoading ? <div style={{ color: '#718096', padding: 16 }}>Loading…</div>
                : filteredPicker.length === 0 ? <div style={{ color: '#718096', padding: 16 }}>No open files available to note. <Link to="/create-file">Create a file</Link>.</div>
                : filteredPicker.map((f) => (
                  <button key={f.id} onClick={() => pickFile(f.id)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', cursor: 'pointer', marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, color: '#2d3748' }}>{f.fileNumber} {f.confidential && <span title="Confidential">🔒</span>}</div>
                    <div style={{ fontSize: 13, color: '#4a5568' }}>{f.subject}</div>
                    <div style={{ fontSize: 12, color: '#a0aec0' }}>{f.section} · held by {f.currentHolderName || '—'}</div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {noteFile && (
        <AddNoteModal file={noteFile} onClose={() => setNoteFile(null)} onSaved={() => { setNoteFile(null); loadStats() }} />
      )}
    </div>
  )
}

export default Dashboard
