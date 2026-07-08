import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiDownload, FiSearch, FiFilter } from 'react-icons/fi'
import { getReport, exportReport } from '../api/reports'
import { prettyStatus } from '../utils/status'
import { useDepartmentNames } from '../hooks/useDepartments'
import './Reports.css'

const td = { padding: '9px 12px', borderBottom: '1px solid #edf2f7', verticalAlign: 'top' }
const th = { padding: '10px 12px', borderBottom: '1px solid #e2e8f0' }

const Reports = () => {
  const SECTIONS = useDepartmentNames()
  const [data, setData] = useState({ rows: [], files: [], summary: {} })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('files') // 'files' (register) | 'log' (activity)
  const [section, setSection] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [search, setSearch] = useState('')

  const load = () => {
    setLoading(true)
    getReport({ section, from, to, search })
      .then((d) => { setData(d); setError(null) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() /* eslint-disable-next-line */ }, [section, from, to])

  const summary = data.summary || {}
  const cards = [
    { label: 'Total Files', value: summary.totalFiles ?? 0 },
    { label: 'Approved', value: summary.approved ?? 0 },
    { label: 'Under Review', value: summary.underReview ?? 0 },
    { label: 'Closed', value: summary.closed ?? 0 },
  ]

  const tabBtn = (id, label) => (
    <button
      onClick={() => setTab(id)}
      style={{
        padding: '8px 16px', borderRadius: 8, border: '1px solid #cbd5e0', cursor: 'pointer',
        background: tab === id ? '#4c51bf' : '#fff', color: tab === id ? '#fff' : '#4a5568', fontWeight: 600,
      }}
    >{label}</button>
  )

  return (
    <div className="reports-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Reports &amp; Logs</h1>
        <button className="btn-primary" onClick={() => exportReport({ section, from, to, search }, tab)}>
          <FiDownload /> Export CSV
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, margin: '16px 0' }}>
        {cards.map((c) => (
          <div key={c.label} style={{ background: '#fff', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 26, fontWeight: 700 }}>{c.value}</div>
            <div style={{ color: '#718096', fontSize: 13 }}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {tabBtn('files', 'All Files')}
        {tabBtn('log', 'Activity Log')}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 220 }}>
          <FiSearch />
          <input type="text" placeholder="Search file number or subject… (Enter)" value={search}
            onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()}
            style={{ flex: 1, padding: '8px 10px', border: '1px solid #cbd5e0', borderRadius: 8 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FiFilter />
          <select value={section} onChange={(e) => setSection(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid #cbd5e0' }}>
            <option value="all">All Departments</option>
            {SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <label style={{ fontSize: 13 }}>From <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label style={{ fontSize: 13 }}>To <input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
      </div>

      <div style={{ background: '#fff', borderRadius: 10, overflow: 'auto' }}>
        {loading ? <div style={{ padding: 20, color: '#718096' }}>Loading…</div>
          : error ? <div style={{ padding: 20, color: '#e53e3e' }}>Couldn’t load report: {error}</div>
          : tab === 'files' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', background: '#f7fafc' }}>
                  {['File Number', 'Subject', 'Department', 'Status', 'Submitted By', 'Current Holder', 'Created'].map((h) => <th key={h} style={th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {(data.files || []).map((f) => (
                  <tr key={f.id}>
                    <td style={td}><Link to={`/file/${f.id}`}>{f.fileNumber}</Link>{f.confidential && <FiLockMark />}</td>
                    <td style={td}>{f.subject}</td>
                    <td style={td}>{f.department}</td>
                    <td style={td}>{prettyStatus(f.status)}</td>
                    <td style={td}>{f.submittedBy || '—'}</td>
                    <td style={td}>{f.holder || '—'}</td>
                    <td style={td}>{new Date(f.createdDate).toLocaleDateString()}</td>
                  </tr>
                ))}
                {(data.files || []).length === 0 && <tr><td style={td} colSpan={7}>No files.</td></tr>}
              </tbody>
            </table>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', background: '#f7fafc' }}>
                  {['Date', 'File', 'Subject', 'Section', 'Action', 'Actor', 'To', 'Remarks'].map((h) => <th key={h} style={th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr key={r.id}>
                    <td style={td}>{new Date(r.date).toLocaleString()}</td>
                    <td style={td}><Link to={`/file/${r.fileId}`}>{r.fileNumber}</Link></td>
                    <td style={td}>{r.subject}</td>
                    <td style={td}>{r.section}</td>
                    <td style={td}>{prettyStatus(r.action)}</td>
                    <td style={td}>{r.actor}</td>
                    <td style={td}>{r.to || '—'}</td>
                    <td style={td}>{r.remarks}</td>
                  </tr>
                ))}
                {data.rows.length === 0 && <tr><td style={td} colSpan={8}>No log entries.</td></tr>}
              </tbody>
            </table>
          )}
      </div>
    </div>
  )
}

const FiLockMark = () => <span title="Confidential" style={{ marginLeft: 6, color: '#e53e3e' }}>🔒</span>

export default Reports
