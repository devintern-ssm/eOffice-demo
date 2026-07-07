import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiSearch } from 'react-icons/fi'
import { listFiles } from '../api/files'
import { statusColor, prettyStatus } from '../utils/status'

/** Live file search in the header — type a file number or subject, click a result to open it. */
const GlobalSearch = () => {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef(null)
  const timer = useRef(null)

  useEffect(() => {
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const runSearch = (term) => {
    if (term.trim().length < 2) { setResults([]); setLoading(false); return }
    setLoading(true)
    listFiles({ search: term.trim() })
      .then((files) => setResults(files.slice(0, 8)))
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }

  const onChange = (e) => {
    const v = e.target.value
    setQ(v)
    setOpen(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => runSearch(v), 250)
  }

  const go = (id) => { setOpen(false); setQ(''); setResults([]); navigate(`/file/${id}`) }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && results[0]) go(results[0].id)
    else if (e.key === 'Escape') setOpen(false)
  }

  const show = open && q.trim().length >= 2

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <div className="search-bar">
        <FiSearch className="search-icon" />
        <input
          type="text"
          value={q}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onFocus={() => q.trim().length >= 2 && setOpen(true)}
          placeholder="Search files by number or subject…"
        />
      </div>
      {show && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, background: '#fff',
          borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.18)', border: '1px solid #e2e8f0',
          zIndex: 1000, maxHeight: 380, overflowY: 'auto',
        }}>
          {loading ? (
            <div style={{ padding: 14, color: '#a0aec0', fontSize: 13 }}>Searching…</div>
          ) : results.length === 0 ? (
            <div style={{ padding: 14, color: '#a0aec0', fontSize: 13 }}>No files match “{q.trim()}”.</div>
          ) : results.map((f) => (
            <div
              key={f.id}
              onClick={() => go(f.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f7fafc' }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#2d3748' }}>
                  {f.fileNumber}
                  {f.confidential && <span title="Confidential" style={{ marginLeft: 6, color: '#e53e3e' }}>🔒</span>}
                </div>
                <div style={{ fontSize: 12, color: '#718096', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.subject} · {f.section}
                </div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: statusColor(f.status), padding: '2px 8px', borderRadius: 10, textTransform: 'uppercase', flexShrink: 0 }}>
                {prettyStatus(f.status)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default GlobalSearch
