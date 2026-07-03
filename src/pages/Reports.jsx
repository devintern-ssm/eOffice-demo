import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiDownload, FiSearch, FiFilter } from 'react-icons/fi'
import { getReport, exportReport } from '../api/reports'
import { prettyStatus } from '../utils/status'
import './Reports.css'

const SECTIONS = ['Administration', 'Accounts', 'Legal', 'Audit', 'Finance', 'Engineering']
const td = { padding: '9px 12px', borderBottom: '1px solid #edf2f7', verticalAlign: 'top' }

const Reports = () => {
  const [data, setData] = useState({ rows: [], summary: {} })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
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

  return (
    <div className="reports-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Reports &amp; Logs</h1>
        <button className="btn-primary" onClick={() => exportReport({ section, from, to, search })}>
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

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 220 }}>
          <FiSearch />
          <input type="text" placeholder="Search file number or subject… (Enter)" value={search}
            onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()}
            style={{ flex: 1, padding: '8px 10px', border: '1px solid #cbd5e0', borderRadius: 8 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FiFilter />
          <select value={section} onChange={(e) => setSection(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid #cbd5e0' }}>
            <option value="all">All Sections</option>
            {SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <label style={{ fontSize: 13 }}>From <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label style={{ fontSize: 13 }}>To <input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
      </div>

      <div style={{ background: '#fff', borderRadius: 10, overflow: 'auto' }}>
        {loading ? <div style={{ padding: 20, color: '#718096' }}>Loading…</div>
          : error ? <div style={{ padding: 20, color: '#e53e3e' }}>Couldn’t load report: {error}</div>
          : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', background: '#f7fafc' }}>
                  {['Date', 'File', 'Subject', 'Section', 'Action', 'Actor', 'To', 'Remarks'].map((h) => (
                    <th key={h} style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                  ))}
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

export default Reports
