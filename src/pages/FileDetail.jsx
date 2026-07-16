import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  FiFile, FiPlus, FiSend, FiLock, FiPrinter, FiUser, FiChevronDown, FiChevronUp,
  FiDownload, FiEye, FiMaximize2, FiMinimize2, FiUserPlus, FiEyeOff, FiCheck, FiCornerUpLeft, FiClock, FiX, FiBookOpen
} from 'react-icons/fi'
import { getFile } from '../api/files'
import { viewCorrespondence, downloadCorrespondence, loadCorrespondenceUrl, correspondenceHistory } from '../api/correspondence'
import { addSigner } from '../api/workflow'
import { handoverFile, transferFile, closeFile } from '../api/lifecycle'
import { uploadMdApproval, addNoteComment } from '../api/approvals'
import { updateNote } from '../api/notes'
import { listUsers } from '../api/users'
import { useAuth } from '../auth/AuthContext'
import { useDepartmentNames } from '../hooks/useDepartments'
import ActionModal from '../components/ActionModal'
import { statusColor, prettyStatus } from '../utils/status'
import { fmtDateTime } from '../utils/format'
import AddNoteModal from '../components/AddNoteModal'
import AddCorrespondenceModal from '../components/AddCorrespondenceModal'
import ReviewModal from '../components/ReviewModal'
import PrintModal from '../components/PrintModal'
import './FileDetail.css'

const FileDetail = () => {
  const { fileId } = useParams()
  const { user } = useAuth()
  const deptNames = useDepartmentNames()
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [noteToSubmit, setNoteToSubmit] = useState(null) // a DRAFT/RETURNED note to edit + put up
  const [showCorrModal, setShowCorrModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [activeAction, setActiveAction] = useState(null) // 'handover' | 'transfer' | 'close' | 'md' | 'addSigner'
  const [userOptions, setUserOptions] = useState([])
  const [maximized, setMaximized] = useState(null) // null | 'noting' | 'correspondence'
  const [preview, setPreview] = useState(null) // { corr, url, page, renderable, isImage }
  const previewUrlRef = useRef(null)
  const [expandedSections, setExpandedSections] = useState({ fileCover: true, movement: false })
  const [expandedCorr, setExpandedCorr] = useState({})
  const [historyFor, setHistoryFor] = useState(null) // { corr, rows } | null

  const openHistory = async (corr) => {
    try { const rows = await correspondenceHistory(fileId, corr.id); setHistoryFor({ corr, rows }) } catch (e) { alert(e.message) }
  }

  useEffect(() => {
    let active = true
    setLoading(true)
    getFile(fileId)
      .then((data) => { if (active) { setFile(data); setError(null) } })
      .catch((e) => { if (active) setError(e.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [fileId])

  useEffect(() => () => { if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current) }, [])

  const refresh = () => getFile(fileId).then((d) => setFile(d)).catch(() => {})

  const stepColor = (s) => ({ PENDING: '#a0aec0', SIGNED: '#38b2ac', RETURNED: '#e53e3e' }[s] || '#a0aec0')

  const openAction = async (type) => {
    if (type === 'handover' || type === 'addSigner') {
      try { setUserOptions(await listUsers()) } catch { /* ignore */ }
    }
    setActiveAction(type)
  }

  const handleComment = async (noteId) => {
    const comment = window.prompt('Add a comment to this note:')
    if (!comment) return
    try { setFile(await addNoteComment(fileId, noteId, comment)) } catch (e) { alert(e.message) }
  }

  const [editingNote, setEditingNote] = useState(null)
  const [editText, setEditText] = useState('')
  const startEdit = (note) => { setEditingNote(note.id); setEditText(note.content) }
  const saveEdit = async (noteId) => {
    try { setFile(await updateNote(fileId, noteId, { content: editText })); setEditingNote(null) } catch (e) { alert(e.message) }
  }

  const clearPreview = () => {
    if (previewUrlRef.current) { URL.revokeObjectURL(previewUrlRef.current); previewUrlRef.current = null }
    setPreview(null)
  }

  // Open a correspondence document inline, optionally jumping to a page within the attachment.
  const openCorrInline = async (corr, page = 1) => {
    if (maximized === 'noting') setMaximized(null)
    if (!corr.storageKey) { clearPreview(); setPreview({ corr, url: null, renderable: false }); return }
    try {
      const url = await loadCorrespondenceUrl(fileId, corr.id)
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = url
      const mime = corr.mime || ''
      const isImage = mime.startsWith('image/')
      const renderable = mime.includes('pdf') || isImage
      setPreview({ corr, url, page, renderable, isImage, isPdf: mime.includes('pdf') })
    } catch (e) { alert(e.message) }
  }

  const scrollToNote = (noteNumber) => {
    const note = (file?.notes || []).find((n) => n.noteNumber === noteNumber)
    if (!note) return
    const el = document.getElementById(`note-${note.id}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('highlighted'); setTimeout(() => el.classList.remove('highlighted'), 3000)
    }
  }

  if (loading) return <div className="file-detail"><div className="error-state"><h2>Loading file…</h2></div></div>
  if (error || !file) {
    return (
      <div className="file-detail">
        <div className="error-state">
          <h2>{error ? `Couldn’t load file: ${error}` : 'File not found'}</h2>
          <Link to="/">Go to Dashboard</Link>
        </div>
      </div>
    )
  }

  const isAdmin = user?.role === 'ADMIN' || file.contentRestricted
  const isHolder = file.currentAssignee === user?.id
  const isOpen = file.status === 'OPEN'
  const noteInFlight = !!file.activeNoteNumber
  const inReview = file.activeNoteStatus === 'IN_REVIEW'
  const returnedToMe = file.activeNoteStatus === 'RETURNED'
  const canOpenNote = !isAdmin && isOpen && !noteInFlight // any officer may raise a note on an idle binder
  const canMove = !isAdmin && isOpen && isHolder && !noteInFlight // hand over / transfer / close — holder only
  const canSign = !isAdmin && isOpen && isHolder && inReview
  const returnedNote = returnedToMe ? (file.notes || []).find((n) => n.noteNumber === file.activeNoteNumber) : null
  const draftNotes = (file.notes || []).filter((n) => n.status === 'DRAFT' && n.author?.id === user?.id)

  const toggleSection = (section) => setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  const toggleCorr = (id) => setExpandedCorr((p) => ({ ...p, [id]: !p[id] }))

  // Resolve a page-level C-number to its attachment + inner page, then open it.
  const openCNumber = (cnum) => {
    const corr = (file.correspondence || []).find((c) => c.firstC != null && cnum >= c.firstC && cnum <= c.lastC)
    if (!corr) { alert(`Correspondence C${cnum} not found.`); return }
    openCorrInline(corr, cnum - corr.firstC + 1)
    setTimeout(() => {
      const el = document.getElementById(`corr-${corr.id}`)
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('highlighted'); setTimeout(() => el.classList.remove('highlighted'), 3000) }
    }, 120)
  }

  const handleReferenceClick = (ref) => {
    const raw = ref.trim()
    if (/^c\/?\d+$/i.test(raw)) openCNumber(parseInt(raw.replace(/\D/g, ''), 10))
    else if (/^note\s+\d+$/i.test(raw)) scrollToNote(parseInt(raw.replace(/\D/g, ''), 10))
  }

  const renderNoteContent = (content) => {
    // Word-boundary guards so "C3" inside "ABC3" or "note 3" inside "Footnote 3" don't become links.
    const pattern = /(?<![A-Za-z0-9])(C\/?\d+|Note\s+\d+)(?![A-Za-z0-9])/gi
    const parts = []; let lastIndex = 0; let match
    while ((match = pattern.exec(content)) !== null) {
      if (match.index > lastIndex) parts.push({ type: 'text', content: content.substring(lastIndex, match.index) })
      parts.push({ type: 'reference', content: match[0], ref: match[1] })
      lastIndex = match.index + match[0].length
    }
    if (lastIndex < content.length) parts.push({ type: 'text', content: content.substring(lastIndex) })
    if (parts.length === 0) return <span>{content}</span>
    return parts.map((part, i) => part.type === 'reference'
      ? <span key={i} className="reference-link" onClick={() => handleReferenceClick(part.ref)} title={`Open ${part.ref}`}>{part.content}</span>
      : <span key={i}>{part.content}</span>)
  }

  const notePages = (n) => (n.startPage ? (n.endPage && n.endPage !== n.startPage ? `pp. ${n.startPage}–${n.endPage}` : `p. ${n.startPage}`) : null)

  const showNoting = maximized !== 'correspondence'
  const showCorr = maximized !== 'noting'

  return (
    <div className="file-detail">
      <div className="file-detail-container">
        {/* Left Pane - File Info */}
        <div className="file-info-pane">
          <div className="info-section">
            <div className="section-header" onClick={() => toggleSection('fileCover')}>
              <h3>File Cover</h3>
              {expandedSections.fileCover ? <FiChevronUp /> : <FiChevronDown />}
            </div>
            {expandedSections.fileCover && (
              <div className="section-content">
                <div className="info-item"><label>File Number (UN)</label><div className="file-number-display">{file.fileNumber}</div></div>
                <div className="info-item"><label>Subject</label><div className="file-subject-display">{file.subject}</div></div>
                <div className="info-item"><label>Section</label><div>{file.section}</div></div>
                <div className="info-item">
                  <label>Status</label>
                  <span className="status-badge" style={{ background: statusColor(file.status) }}>{prettyStatus(file.status)}</span>
                </div>
                <div className="info-item"><label>Current Holder</label><div>{file.currentHolderName || '—'}</div></div>
                {noteInFlight && (
                  <div className="info-item">
                    <label>Active Note</label>
                    <div>Note {file.activeNoteNumber} <span style={{ color: statusColor(file.activeNoteStatus) }}>· {prettyStatus(file.activeNoteStatus)}</span></div>
                  </div>
                )}
                {file.confidential && (
                  <div className="info-item"><label>Confidential</label><span className="confidential-badge"><FiLock /> CONFIDENTIAL</span></div>
                )}
                <div className="info-item"><label>Created</label><div>{new Date(file.createdDate).toLocaleDateString()}</div></div>
                <div className="info-item"><label>Last Modified</label><div>{new Date(file.lastModified).toLocaleDateString()}</div></div>
              </div>
            )}
          </div>

          {/* My draft notes */}
          {!isAdmin && draftNotes.length > 0 && (
            <div className="info-section">
              <div className="section-header"><h3>My Drafts ({draftNotes.length})</h3></div>
              <div className="section-content">
                <div className="draft-list">
                  {draftNotes.map((n) => (
                    <div key={n.id} className="draft-item">
                      <span style={{ cursor: 'pointer', flex: 1 }} onClick={() => scrollToNote(n.noteNumber)} title="Go to draft note">Note {n.noteNumber}</span>
                      {isHolder && !noteInFlight && (
                        <button className="corr-btn" style={{ width: 'auto', padding: '2px 8px' }} onClick={() => setNoteToSubmit(n)}>Put up</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Movement Timeline */}
          <div className="info-section">
            <div className="section-header" onClick={() => toggleSection('movement')}>
              <h3>File Movement</h3>
              {expandedSections.movement ? <FiChevronUp /> : <FiChevronDown />}
            </div>
            {expandedSections.movement && (
              <div className="section-content">
                <div className="movement-timeline">
                  {file.movements.length > 0 ? file.movements.map((mov) => (
                    <div key={mov.id} className="movement-item">
                      <div className="movement-dot"></div>
                      <div className="movement-content">
                        <div className="movement-action">{prettyStatus(mov.action)}{mov.noteNumber ? ` · Note ${mov.noteNumber}` : ''}</div>
                        <div className="movement-route">
                          {mov.from.name}{mov.from.section ? ` · ${mov.from.section}` : ''}
                          {' → '}
                          {mov.to.name ? `${mov.to.name}${mov.to.section ? ` · ${mov.to.section}` : ''}` : (mov.to.section || '—')}
                        </div>
                        <div className="movement-date">{fmtDateTime(mov.date)}</div>
                        {mov.remarks && <div className="movement-remarks">{mov.remarks}</div>}
                      </div>
                    </div>
                  )) : <div className="no-movements">No movements yet</div>}
                </div>
              </div>
            )}
          </div>

          {/* Signature chain of the in-flight note */}
          {file.steps && file.steps.length > 0 && (
            <div className="info-section">
              <div className="section-header"><h3>Signature Chain — Note {file.activeNoteNumber}</h3></div>
              <div className="section-content">
                {file.steps.map((s) => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 0', borderBottom: '1px solid #edf2f7' }}>
                    <span style={{ minWidth: 22, height: 22, borderRadius: '50%', background: stepColor(s.status), color: '#fff', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.stepOrder}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>
                        {s.signerName} <span style={{ color: '#718096', fontWeight: 400 }}>({s.roleLabel})</span>
                        {file.currentAssignee === s.signerId && s.status === 'PENDING' && <span style={{ marginLeft: 6, fontSize: 11, color: '#ed8936' }}>● current</span>}
                      </div>
                      <div style={{ fontSize: 12, color: '#4a5568' }}>
                        {prettyStatus(s.status)}
                        {s.actedAt ? ` · ${fmtDateTime(s.actedAt)}` : ''}
                        {s.signatureName && s.status !== 'PENDING' ? ` · ✍ ${s.signatureName}` : ''}
                      </div>
                      {s.remarks && s.status !== 'PENDING' && <div style={{ fontSize: 12, color: '#718096', fontStyle: 'italic' }}>{s.remarks}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {isAdmin ? (
            <div className="info-section">
              <div className="section-content" style={{ color: '#718096', fontSize: 13 }}>
                <FiEyeOff style={{ verticalAlign: '-2px' }} /> Oversight view — Noting &amp; Correspondence are hidden for the admin role.
              </div>
            </div>
          ) : (
            <div className="quick-actions">
              {/* Book reader — open to everyone; read the whole file like a physical file */}
              <Link to={`/file/${fileId}/read`} className="action-btn" style={{ textDecoration: 'none', background: '#ebf4ff', borderColor: '#bee3f8', color: '#2b6cb0' }}><FiBookOpen /> Open Reader</Link>
              {/* Note under signature and I hold it → sign / send back */}
              {canSign && (
                <>
                  <button className="action-btn primary" onClick={() => setShowReviewModal(true)}><FiCheck /> Sign / Send Back</button>
                  <button className="action-btn" onClick={() => openAction('addSigner')}><FiUserPlus /> Add Signer</button>
                  <button className="action-btn" onClick={() => openAction('md')}><FiFile /> Record Offline Signature</button>
                </>
              )}
              {/* Note sent back to me (maker) → edit & resubmit */}
              {returnedToMe && isHolder && returnedNote && (
                <button className="action-btn primary" onClick={() => setNoteToSubmit(returnedNote)}><FiCornerUpLeft /> Edit &amp; Resubmit Note {file.activeNoteNumber}</button>
              )}
              {/* Idle binder → any officer may raise the next note */}
              {canOpenNote && (
                <button className="action-btn primary" onClick={() => setShowNoteModal(true)}><FiPlus /> Add Note</button>
              )}
              {/* Any officer may attach correspondence while the file is open */}
              {!isAdmin && isOpen && (
                <button className="action-btn" onClick={() => setShowCorrModal(true)}><FiPlus /> Add Correspondence</button>
              )}
              {/* Move / close the binder — current holder only, when idle */}
              {canMove && (
                <>
                  <button className="action-btn" onClick={() => openAction('handover')}><FiSend /> Hand Over</button>
                  <button className="action-btn" onClick={() => openAction('transfer')}><FiSend /> Transfer Dept</button>
                  <button className="action-btn" onClick={() => openAction('close')}><FiLock /> Close File</button>
                </>
              )}
              <button className="action-btn" onClick={() => setShowPrintModal(true)}><FiPrinter /> Print…</button>

              {noteInFlight && !canSign && (
                <div style={{ fontSize: 12, color: '#a0aec0', padding: '4px 2px' }}>
                  Note {file.activeNoteNumber} is in progress with {file.currentHolderName || '—'}.
                </div>
              )}
              {file.status === 'CLOSED' && <div style={{ fontSize: 12, color: '#a0aec0', padding: '4px 2px' }}>This file is closed (read-only).</div>}
            </div>
          )}
        </div>

        {/* Right Pane */}
        {isAdmin ? (
          <div className="file-content-pane" style={{ display: 'flex' }}>
            <div className="noting-side" style={{ maxHeight: 'none' }}>
              <div className="side-header"><h2>Restricted</h2></div>
              <div className="notes-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <div style={{ color: '#718096' }}>
                  <FiEyeOff size={28} style={{ marginBottom: 12 }} />
                  <p>The Noting and Correspondence modules are not available to the admin (oversight) role.</p>
                  <p style={{ fontSize: 13 }}>Use <Link to="/reports">Reports &amp; Logs</Link> for file oversight.</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="file-content-pane">
            {/* Noting Side */}
            {showNoting && (
              <div className="noting-side">
                <div className="side-header">
                  <h2>NOTING SIDE</h2>
                  <button className="maximize-btn" title={maximized === 'noting' ? 'Restore' : 'Maximise'} onClick={() => setMaximized(maximized === 'noting' ? null : 'noting')}>
                    {maximized === 'noting' ? <FiMinimize2 /> : <FiMaximize2 />}
                  </button>
                </div>
                <div className="notes-container">
                  {file.notes.map((note) => (
                    <div key={note.id} id={`note-${note.id}`} className="note-card">
                      <div className="note-header">
                        <div className="note-number">
                          Note {note.noteNumber}
                          {notePages(note) && <span style={{ marginLeft: 8, fontSize: 12, color: '#718096', fontWeight: 400 }}>{notePages(note)}</span>}
                          <span className="status-badge" style={{ marginLeft: 8, background: statusColor(note.status), fontSize: 10, padding: '1px 7px' }}>{prettyStatus(note.status)}</span>
                        </div>
                        <div className="note-date">{fmtDateTime(note.date)}</div>
                      </div>
                      {editingNote === note.id ? (
                        <div className="note-content">
                          <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={6} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e0' }} />
                          <div style={{ marginTop: 6, display: 'flex', gap: 8 }}>
                            <button className="corr-btn" style={{ width: 'auto', background: '#c6f6d5', color: '#22543d', borderColor: '#9ae6b4' }} onClick={() => saveEdit(note.id)}>Save</button>
                            <button className="corr-btn" style={{ width: 'auto' }} onClick={() => setEditingNote(null)}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="note-content">{renderNoteContent(note.content)}</div>
                      )}

                      <div className="note-footer">
                        <div className="author-info">
                          <FiUser className="author-icon" />
                          <div>
                            <div className="author-name">Maker: {note.author.name}</div>
                            <div className="author-designation">{note.author.designation}{note.author.role ? ` (${note.author.role})` : ''}</div>
                          </div>
                        </div>
                      </div>

                      {/* Per-note signer chain */}
                      {note.steps && note.steps.length > 0 && (
                        <div className="note-signers" style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {note.steps.map((s) => (
                            <span key={s.id} title={s.remarks || ''} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#f7fafc', border: `1px solid ${stepColor(s.status)}`, color: '#4a5568' }}>
                              {s.stepOrder}. {s.signerName} · {prettyStatus(s.status)}
                            </span>
                          ))}
                        </div>
                      )}

                      {note.isSuoMoto && <div className="note-status" style={{ color: '#805ad5' }}>Suo-moto note</div>}

                      {note.checkerComments && note.checkerComments.length > 0 && (
                        <div style={{ marginTop: 6, fontSize: 12 }}>
                          {note.checkerComments.map((c, i) => (
                            <div key={i} style={{ color: '#4a5568', marginTop: 2 }}>💬 <strong>{c.checkerName}:</strong> {c.comment}</div>
                          ))}
                        </div>
                      )}

                      {/* Maker can edit a draft / returned note */}
                      {note.author?.id === user?.id && isHolder && editingNote !== note.id && (note.status === 'DRAFT' || note.status === 'RETURNED') && (
                        <>
                          <button className="corr-btn" style={{ marginTop: 6, marginRight: 6, width: 'auto', display: 'inline-flex' }} onClick={() => startEdit(note)}>✎ Edit</button>
                          {!noteInFlight || note.status === 'RETURNED' ? (
                            <button className="corr-btn" style={{ marginTop: 6, marginRight: 6, width: 'auto', display: 'inline-flex', background: '#c6f6d5', color: '#22543d', borderColor: '#9ae6b4' }} onClick={() => setNoteToSubmit(note)}>✓ Put up for signature</button>
                          ) : null}
                        </>
                      )}
                      {file.status !== 'CLOSED' && note.status === 'FINALIZED' && (
                        <button className="corr-btn" style={{ marginTop: 6 }} onClick={() => handleComment(note.id)}>＋ Comment</button>
                      )}
                    </div>
                  ))}
                  {canOpenNote && <button className="add-note-btn" onClick={() => setShowNoteModal(true)}><FiPlus /> Add New Note</button>}
                  {noteInFlight && <div style={{ padding: 10, fontSize: 12, color: '#a0aec0', textAlign: 'center' }}>Note {file.activeNoteNumber} is in progress — finish it before starting another note.</div>}
                </div>
              </div>
            )}

            {/* Correspondence Side */}
            {showCorr && (
              <div className="correspondence-side">
                <div className="side-header">
                  <h2>CORRESPONDENCE SIDE</h2>
                  <button className="maximize-btn" title={maximized === 'correspondence' ? 'Restore' : 'Maximise'} onClick={() => setMaximized(maximized === 'correspondence' ? null : 'correspondence')}>
                    {maximized === 'correspondence' ? <FiMinimize2 /> : <FiMaximize2 />}
                  </button>
                </div>

                {preview && (
                  <div className="corr-preview">
                    <div className="corr-preview-head">
                      <span>{preview.corr.cLabel || preview.corr.number} — {preview.corr.title}{preview.page ? ` · page ${preview.page}` : ''}</span>
                      <button className="corr-btn" style={{ flex: 'none' }} onClick={clearPreview}>Close</button>
                    </div>
                    {preview.url && preview.isImage ? (
                      <div style={{ padding: 8, textAlign: 'center', background: '#fff', maxHeight: 360, overflow: 'auto' }}>
                        <img src={preview.url} alt={preview.corr.title} style={{ maxWidth: '100%', maxHeight: 340 }} />
                      </div>
                    ) : preview.url && preview.renderable ? (
                      <iframe src={preview.isPdf && preview.page ? `${preview.url}#page=${preview.page}` : preview.url} title={`Preview ${preview.corr.number}`} />
                    ) : (
                      <div className="corr-preview-msg">
                        {preview.corr.storageKey
                          ? <>This file type ({preview.corr.mime}) can’t preview inline. <button className="corr-btn" style={{ display: 'inline-flex', width: 'auto' }} onClick={() => viewCorrespondence(file.id, preview.corr.id)}>Open in new tab</button></>
                          : 'This correspondence is an email reference (no attached document).'}
                      </div>
                    )}
                  </div>
                )}

                <div className="correspondence-container">
                  {file.correspondence && file.correspondence.length > 0 ? (
                    <>
                      {file.correspondence.map((corr) => (
                        <div key={corr.id} id={`corr-${corr.id}`} className="corr-card" data-corr-number={corr.cLabel}>
                          <div className="corr-number">{corr.cLabel || corr.number}</div>
                          <div className="corr-content">
                            <div className="corr-type">{corr.type}</div>
                            <div className="corr-title">{corr.title}</div>
                            <div className="corr-meta">
                              {corr.inwardDate && <span>Inward: {new Date(corr.inwardDate).toLocaleDateString()}</span>}
                              {corr.inwardNumber && <span>No: {corr.inwardNumber}</span>}
                              {corr.pageCount ? <span className="corr-pages">{corr.pageCount} pg</span> : null}
                            </div>
                            {corr.cPages && corr.cPages.length > 1 && (
                              <div style={{ marginTop: 4 }}>
                                <button className="corr-btn" style={{ width: 'auto', padding: '2px 8px' }} onClick={() => toggleCorr(corr.id)}>
                                  {expandedCorr[corr.id] ? 'Hide pages' : `Show ${corr.cPages.length} pages`}
                                </button>
                                {expandedCorr[corr.id] && (
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                                    {corr.cPages.map((cn, i) => (
                                      <button key={cn} className="corr-btn" style={{ width: 'auto', padding: '2px 8px' }} onClick={() => openCorrInline(corr, i + 1)} title={`Open page ${i + 1}`}>C{cn}</button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                            {corr.storageKey && (
                              <div className="corr-actions">
                                <button className="corr-btn" onClick={() => openCorrInline(corr, 1)}><FiEye /> Open</button>
                                <button className="corr-btn" onClick={() => downloadCorrespondence(file.id, corr.id, corr.originalName || `${(corr.cLabel || corr.number).replace(/[^\w-]/g, '_')}`)}><FiDownload /> Download</button>
                                <button className="corr-btn" onClick={() => openHistory(corr)} title="Who downloaded/opened this"><FiClock /> History</button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {isHolder && isOpen && <button className="add-corr-btn" onClick={() => setShowCorrModal(true)}><FiPlus /> Add Correspondence</button>}
                    </>
                  ) : (
                    <div className="empty-correspondence">
                      <p>No correspondence added yet</p>
                      {isHolder && isOpen && <button className="add-corr-btn" onClick={() => setShowCorrModal(true)}><FiPlus /> Add First Correspondence</button>}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showNoteModal && <AddNoteModal file={file} onClose={() => setShowNoteModal(false)} onSaved={refresh} />}
      {noteToSubmit && <AddNoteModal file={file} note={noteToSubmit} onClose={() => setNoteToSubmit(null)} onSaved={refresh} />}
      {showCorrModal && <AddCorrespondenceModal file={file} onClose={() => setShowCorrModal(false)} onSaved={refresh} />}
      {showReviewModal && <ReviewModal file={file} onClose={() => setShowReviewModal(false)} onSaved={refresh} />}
      {showPrintModal && <PrintModal file={file} onClose={() => setShowPrintModal(false)} />}
      {historyFor && (
        <div className="modal-overlay" onClick={() => setHistoryFor(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, width: 'min(520px, 92vw)', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid #edf2f7' }}>
              <h2 style={{ margin: 0, fontSize: 17 }}><FiClock style={{ verticalAlign: '-2px' }} /> Access history — {historyFor.corr.cLabel || historyFor.corr.number}</h2>
              <button onClick={() => setHistoryFor(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18 }}><FiX /></button>
            </div>
            <div style={{ overflow: 'auto', padding: '8px 18px 16px' }}>
              <div style={{ fontSize: 12, color: '#718096', margin: '4px 0 8px' }}>{historyFor.corr.title}</div>
              {historyFor.rows.length === 0 ? (
                <div style={{ color: '#718096', padding: '12px 0' }}>No downloads or opens recorded yet.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead><tr style={{ textAlign: 'left', color: '#718096' }}>
                    <th style={{ padding: '6px 4px', borderBottom: '1px solid #e2e8f0' }}>Action</th>
                    <th style={{ padding: '6px 4px', borderBottom: '1px solid #e2e8f0' }}>By</th>
                    <th style={{ padding: '6px 4px', borderBottom: '1px solid #e2e8f0' }}>When</th>
                  </tr></thead>
                  <tbody>
                    {historyFor.rows.map((r) => (
                      <tr key={r.id}>
                        <td style={{ padding: '6px 4px', borderBottom: '1px solid #edf2f7' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 10, background: r.action === 'DOWNLOAD' ? '#e6fffa' : '#edf2f7', color: r.action === 'DOWNLOAD' ? '#2c7a7b' : '#4a5568' }}>{r.action}</span>
                        </td>
                        <td style={{ padding: '6px 4px', borderBottom: '1px solid #edf2f7' }}>{r.userName}</td>
                        <td style={{ padding: '6px 4px', borderBottom: '1px solid #edf2f7' }}>{fmtDateTime(r.date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
      {activeAction === 'handover' && (
        <ActionModal
          title="Hand Over the File" submitLabel="Hand Over"
          onClose={() => setActiveAction(null)}
          fields={[
            { name: 'toUserId', label: 'Hand over to', type: 'select', required: true, options: userOptions.filter((u) => u.role !== 'ADMIN').map((u) => ({ value: u.id, label: `${u.name} — ${u.section} (${u.role})` })) },
            { name: 'remarks', label: 'Note', type: 'textarea' },
          ]}
          onSubmit={async (v) => setFile(await handoverFile(fileId, { toUserId: v.toUserId, remarks: v.remarks }))}
        />
      )}
      {activeAction === 'addSigner' && (
        <ActionModal
          title="Add a Signer to the Note" submitLabel="Add Signer"
          onClose={() => setActiveAction(null)}
          fields={[
            { name: 'userId', label: 'Signer', type: 'select', required: true, options: userOptions.filter((u) => u.role !== 'ADMIN').map((u) => ({ value: u.id, label: `${u.name} — ${u.section} (${u.role})` })) },
            { name: 'roleLabel', label: 'Role label', type: 'text', hint: 'e.g. Checker, Approver, MD' },
          ]}
          onSubmit={async (v) => setFile(await addSigner(fileId, { userId: v.userId, roleLabel: v.roleLabel }))}
        />
      )}
      {activeAction === 'transfer' && (
        <ActionModal
          title="Transfer to Another Department" submitLabel="Transfer"
          onClose={() => setActiveAction(null)}
          fields={[
            { name: 'toSection', label: 'Department', type: 'select', required: true, options: deptNames.filter((s) => s !== file.section).map((s) => ({ value: s, label: s })) },
            { name: 'reason', label: 'Reason', type: 'textarea', hint: 'The UN number stays the same on transfer.' },
          ]}
          onSubmit={async (v) => setFile(await transferFile(fileId, { toSection: v.toSection, reason: v.reason }))}
        />
      )}
      {activeAction === 'close' && (
        <ActionModal
          title="Close File" submitLabel="Close File"
          onClose={() => setActiveAction(null)}
          fields={[{ name: 'reason', label: 'Reason for closing', type: 'textarea', required: true, hint: 'The file becomes read-only; the close date is recorded.' }]}
          onSubmit={async (v) => setFile(await closeFile(fileId, { reason: v.reason }))}
        />
      )}
      {activeAction === 'md' && (
        <ActionModal
          title="Record Offline Signature (scanned PDF)" submitLabel="Upload & Sign"
          onClose={() => setActiveAction(null)}
          fields={[
            { name: 'file', label: 'Scanned signed copy (PDF)', type: 'file', accept: 'application/pdf', required: true },
            { name: 'remarks', label: 'Remarks', type: 'text' },
          ]}
          onSubmit={async (v) => setFile(await uploadMdApproval(fileId, { remarks: v.remarks, file: v.file }))}
        />
      )}
    </div>
  )
}

export default FileDetail
