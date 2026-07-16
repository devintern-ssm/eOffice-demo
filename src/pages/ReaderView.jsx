import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FiX, FiChevronLeft, FiChevronRight, FiFileText } from 'react-icons/fi'
import { getFile } from '../api/files'
import { loadCorrespondenceUrl } from '../api/correspondence'
import { statusColor, prettyStatus } from '../utils/status'
import { fmtDateTime } from '../utils/format'
import './ReaderView.css'

const stepColor = (s) => ({ PENDING: '#a0aec0', SIGNED: '#38b2ac', RETURNED: '#e53e3e' }[s] || '#a0aec0')

/**
 * Full-screen, read-only "book reader" for a file: NOTING on the left, CORRESPONDENCE on the
 * right — exactly like an open physical file — with page-flip navigation so a reviewer (e.g. the
 * final approver) can go through everything quickly before signing. Reuses the file detail data.
 */
export default function ReaderView() {
  const { fileId } = useParams()
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [error, setError] = useState(null)
  const [cIndex, setCIndex] = useState(0)     // index into the flat C-page list
  const [noteIndex, setNoteIndex] = useState(0)
  const [blobUrl, setBlobUrl] = useState(null)
  const [loadingDoc, setLoadingDoc] = useState(false)
  const blobCache = useRef({}) // corrId -> objectURL

  useEffect(() => {
    let active = true
    getFile(fileId).then((f) => { if (active) setFile(f) }).catch((e) => { if (active) setError(e.message) })
    return () => { active = false }
  }, [fileId])

  useEffect(() => () => { Object.values(blobCache.current).forEach((u) => URL.revokeObjectURL(u)) }, [])

  const notes = file?.notes || []
  const correspondence = useMemo(() => (file?.correspondence || []).filter((c) => c.storageKey), [file])

  // A flat, ordered list of every C-page across all attachments.
  const cPages = useMemo(() => {
    const out = []
    correspondence.forEach((c) => (c.cPages || []).forEach((cn, i) => out.push({ cNumber: cn, corrId: c.id, corr: c, innerPage: i + 1 })))
    return out
  }, [correspondence])

  const current = cPages[cIndex] || null

  // Load (and cache) the blob for the current attachment.
  useEffect(() => {
    if (!current) { setBlobUrl(null); return }
    const cached = blobCache.current[current.corrId]
    if (cached) { setBlobUrl(cached); return }
    let active = true
    setLoadingDoc(true)
    loadCorrespondenceUrl(fileId, current.corrId)
      .then((url) => { if (!active) { URL.revokeObjectURL(url); return } blobCache.current[current.corrId] = url; setBlobUrl(url) })
      .catch(() => {})
      .finally(() => { if (active) setLoadingDoc(false) })
    return () => { active = false }
  }, [current?.corrId, fileId]) // eslint-disable-line react-hooks/exhaustive-deps

  const gotoCPage = useCallback((cNumber) => {
    const idx = cPages.findIndex((p) => p.cNumber === cNumber)
    if (idx >= 0) setCIndex(idx)
  }, [cPages])

  const prevC = useCallback(() => setCIndex((i) => Math.max(0, i - 1)), [])
  const nextC = useCallback(() => setCIndex((i) => Math.min(cPages.length - 1, i + 1)), [cPages.length])

  const scrollToNote = (n) => { const el = document.getElementById(`read-note-${n}`); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
  const goNote = (i) => { const clamped = Math.max(0, Math.min(notes.length - 1, i)); setNoteIndex(clamped); scrollToNote(notes[clamped]?.noteNumber) }

  // Keyboard: ←/→ flip correspondence, Esc closes.
  useEffect(() => {
    const onKey = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return
      if (e.key === 'ArrowRight') nextC()
      else if (e.key === 'ArrowLeft') prevC()
      else if (e.key === 'Escape') navigate(`/file/${fileId}`)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [nextC, prevC, navigate, fileId])

  const onRef = (ref) => {
    const raw = ref.trim()
    if (/^c\/?\d+$/i.test(raw)) gotoCPage(parseInt(raw.replace(/\D/g, ''), 10))
    else if (/^note\s+\d+$/i.test(raw)) scrollToNote(parseInt(raw.replace(/\D/g, ''), 10))
  }

  const renderContent = (content) => {
    const pattern = /(?<![A-Za-z0-9])(C\/?\d+|Note\s+\d+)(?![A-Za-z0-9])/gi
    const parts = []; let last = 0; let m
    while ((m = pattern.exec(content)) !== null) {
      if (m.index > last) parts.push({ t: 'text', v: content.slice(last, m.index) })
      parts.push({ t: 'ref', v: m[0] })
      last = m.index + m[0].length
    }
    if (last < content.length) parts.push({ t: 'text', v: content.slice(last) })
    return parts.map((p, i) => (p.t === 'ref'
      ? <span key={i} className="read-ref" onClick={() => onRef(p.v)} title={`Go to ${p.v}`}>{p.v}</span>
      : <span key={i}>{p.v}</span>))
  }

  const closeBtn = <button className="reader-close" onClick={() => navigate(`/file/${fileId}`)}><FiX /> Close</button>

  if (error) return <div className="reader"><div className="reader-bar"><span>Couldn’t load file: {error}</span>{closeBtn}</div></div>
  if (!file) return <div className="reader"><div className="reader-empty">Opening reader…</div></div>
  if (file.contentRestricted) {
    return <div className="reader"><div className="reader-bar"><span><FiFileText /> {file.fileNumber}</span>{closeBtn}</div>
      <div className="reader-empty">The Noting &amp; Correspondence are not available to the admin (oversight) role.</div></div>
  }

  return (
    <div className="reader">
      <div className="reader-bar">
        <div className="reader-title">
          <FiFileText /> <strong>{file.fileNumber}</strong>
          <span className="reader-subject">{file.subject}</span>
          <span className="reader-status" style={{ background: statusColor(file.status) }}>{prettyStatus(file.status)}</span>
        </div>
        {closeBtn}
      </div>

      <div className="reader-book">
        {/* LEFT — NOTING */}
        <div className="reader-side reader-notes">
          <div className="reader-side-head">
            <span className="reader-side-title">NOTING</span>
            {notes.length > 0 && (
              <div className="reader-nav">
                <button onClick={() => goNote(noteIndex - 1)} disabled={noteIndex <= 0}><FiChevronLeft /></button>
                <span>Note {notes[noteIndex]?.noteNumber ?? '–'} / {notes.length}</span>
                <button onClick={() => goNote(noteIndex + 1)} disabled={noteIndex >= notes.length - 1}><FiChevronRight /></button>
              </div>
            )}
          </div>
          <div className="reader-side-body">
            {notes.length === 0 && <div className="reader-empty">No notes on this file.</div>}
            {notes.map((n) => (
              <div key={n.id} id={`read-note-${n.noteNumber}`} className="read-note">
                <div className="read-note-head">
                  <strong>Note {n.noteNumber}</strong>
                  {n.startPage && <span className="muted">pp. {n.startPage}{n.endPage && n.endPage !== n.startPage ? `–${n.endPage}` : ''}</span>}
                  <span className="read-badge" style={{ background: statusColor(n.status) }}>{prettyStatus(n.status)}</span>
                  <span className="muted reader-note-date">{fmtDateTime(n.date)}</span>
                </div>
                <div className="read-note-body">{renderContent(n.content)}</div>
                <div className="read-note-foot muted">Maker: {n.author?.name}{n.author?.designation ? `, ${n.author.designation}` : ''}{n.author?.role ? ` (${n.author.role})` : ''}</div>
                {n.steps && n.steps.length > 0 && (
                  <div className="read-signs">
                    {n.steps.map((s) => (
                      <span key={s.id} className="read-sign" style={{ borderColor: stepColor(s.status) }} title={s.remarks || ''}>
                        {s.stepOrder}. {s.signerName} · {s.roleLabel} · {prettyStatus(s.status)}{s.signatureName && s.status === 'SIGNED' ? ' ✍' : ''}{s.actedAt ? ` · ${fmtDateTime(s.actedAt)}` : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="reader-spine" />

        {/* RIGHT — CORRESPONDENCE */}
        <div className="reader-side reader-corr">
          <div className="reader-side-head">
            <span className="reader-side-title">CORRESPONDENCE</span>
            {cPages.length > 0 && (
              <div className="reader-nav">
                <button onClick={prevC} disabled={cIndex <= 0}><FiChevronLeft /></button>
                <span>C{current?.cNumber ?? '–'} / C{cPages.length}</span>
                <button onClick={nextC} disabled={cIndex >= cPages.length - 1}><FiChevronRight /></button>
              </div>
            )}
          </div>
          {current && <div className="reader-doc-label">{current.corr.cLabel} · {current.corr.type} — {current.corr.title}</div>}
          <div className="reader-side-body reader-doc">
            {cPages.length === 0 ? <div className="reader-empty">No correspondence on this file.</div>
              : (loadingDoc && !blobUrl) ? <div className="reader-empty">Loading document…</div>
              : blobUrl ? (
                current.corr.mime && current.corr.mime.startsWith('image/')
                  ? <img src={blobUrl} alt={current.corr.title} className="reader-img" />
                  : <iframe key={current.corrId} title="correspondence" src={`${blobUrl}#page=${current.innerPage}&toolbar=0&navpanes=0&view=FitH`} />
              ) : <div className="reader-empty">—</div>}
          </div>
          {correspondence.length > 1 && (
            <div className="reader-strip">
              {correspondence.map((c) => (
                <button key={c.id} className={`reader-chip ${current && current.corrId === c.id ? 'active' : ''}`} onClick={() => gotoCPage(c.firstC)} title={`${c.type} — ${c.title}`}>{c.cLabel}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="reader-hint">Use ← → to flip correspondence pages · click a reference (e.g. C3) in a note to jump · Esc to close</div>
    </div>
  )
}
