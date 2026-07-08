import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  FiFile, FiPlus, FiSend, FiLock, FiPrinter, FiUser, FiChevronDown, FiChevronUp,
  FiDownload, FiEye, FiMaximize2, FiMinimize2, FiUserCheck, FiEyeOff
} from 'react-icons/fi'
import { getFile } from '../api/files'
import { viewCorrespondence, downloadCorrespondence, loadCorrespondenceUrl } from '../api/correspondence'
import { removeStep } from '../api/workflow'
import { routeToDept, returnToMaker, transferFile, closeFile } from '../api/lifecycle'
import { uploadMdApproval, addNoteComment } from '../api/approvals'
import { submitNote, updateNote } from '../api/notes'
import { openPrint } from '../api/print'
import { listUsers } from '../api/users'
import { useAuth } from '../auth/AuthContext'
import { useDepartmentNames } from '../hooks/useDepartments'
import ActionModal from '../components/ActionModal'
import { statusColor, prettyStatus } from '../utils/status'
import AddNoteModal from '../components/AddNoteModal'
import AddCorrespondenceModal from '../components/AddCorrespondenceModal'
import ForwardFileModal from '../components/ForwardFileModal'
import ReviewModal from '../components/ReviewModal'
import AssignRolesModal from '../components/AssignRolesModal'
import './FileDetail.css'

const FileDetail = () => {
  const { fileId } = useParams()
  const { user } = useAuth()
  const deptNames = useDepartmentNames()
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [showCorrModal, setShowCorrModal] = useState(false)
  const [showForwardModal, setShowForwardModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [activeAction, setActiveAction] = useState(null) // 'route' | 'return' | 'transfer' | 'close' | 'md'
  const [userOptions, setUserOptions] = useState([])
  const [maximized, setMaximized] = useState(null) // null | 'noting' | 'correspondence'
  const [preview, setPreview] = useState(null) // { corr, url, renderable }
  const previewUrlRef = useRef(null)
  const [expandedSections, setExpandedSections] = useState({ fileCover: true, movement: false })

  useEffect(() => {
    let active = true
    setLoading(true)
    getFile(fileId)
      .then((data) => { if (active) { setFile(data); setError(null) } })
      .catch((e) => { if (active) setError(e.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [fileId])

  // Revoke the inline-preview object URL on unmount.
  useEffect(() => () => { if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current) }, [])

  const refresh = () => getFile(fileId).then((d) => setFile(d)).catch(() => {})

  const stepColor = (s) => ({ PENDING: '#a0aec0', CHECKED: '#4299e1', APPROVED: '#38b2ac', REVERTED: '#e53e3e', SKIPPED: '#a0aec0' }[s] || '#a0aec0')

  const handleRemoveStep = async (stepId) => {
    try { await removeStep(fileId, stepId); refresh() } catch (e) { alert(e.message) }
  }

  const openAction = async (type) => {
    if (type === 'route') {
      try { setUserOptions(await listUsers()) } catch { /* ignore */ }
    }
    setActiveAction(type)
  }

  const handleComment = async (noteId) => {
    const comment = window.prompt('Add a comment to this note:')
    if (!comment) return
    try { setFile(await addNoteComment(fileId, noteId, comment)) } catch (e) { alert(e.message) }
  }

  const handleSubmitDraft = async (noteId) => {
    try { await submitNote(fileId, noteId); refresh() } catch (e) { alert(e.message) }
  }

  const [editingNote, setEditingNote] = useState(null)
  const [editText, setEditText] = useState('')
  const startEdit = (note) => { setEditingNote(note.id); setEditText(note.content) }
  const saveEdit = async (noteId) => {
    try { setFile(await updateNote(fileId, noteId, editText)); setEditingNote(null) } catch (e) { alert(e.message) }
  }

  const clearPreview = () => {
    if (previewUrlRef.current) { URL.revokeObjectURL(previewUrlRef.current); previewUrlRef.current = null }
    setPreview(null)
  }

  // Open a correspondence document inline on the correspondence side (review #3).
  const openCorrInline = async (corr) => {
    if (maximized === 'noting') setMaximized(null) // ensure the correspondence side is visible
    if (!corr.storageKey) { clearPreview(); setPreview({ corr, url: null, renderable: false }); return }
    try {
      const url = await loadCorrespondenceUrl(fileId, corr.id)
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = url
      const mime = corr.mime || ''
      const isImage = mime.startsWith('image/')
      const renderable = mime.includes('pdf') || isImage
      setPreview({ corr, url, renderable, isImage })
    } catch (e) { alert(e.message) }
  }

  const scrollToNote = (noteNumber) => {
    const note = (file?.notes || []).find((n) => n.noteNumber === noteNumber)
    if (!note) return
    const el = document.getElementById(`note-${note.id}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('highlighted')
      setTimeout(() => el.classList.remove('highlighted'), 3000)
    }
  }

  if (loading) {
    return <div className="file-detail"><div className="error-state"><h2>Loading file…</h2></div></div>
  }
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
  const canAddNote = !isAdmin && isHolder && file.status !== 'CLOSED' // only the holder may add a note (#5)
  const draftNotes = (file.notes || []).filter((n) => n.status === 'DRAFT')

  const toggleSection = (section) => setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))

  const handleReferenceClick = (ref) => {
    const normalizedRef = ref.trim()
    if (normalizedRef.startsWith('C/')) {
      if (!file.correspondence || file.correspondence.length === 0) { alert('No correspondence available in this file'); return }
      const corr = file.correspondence.find((c) => c.number === normalizedRef)
      if (!corr) { alert(`Correspondence ${normalizedRef} not found. Available: ${file.correspondence.map((c) => c.number).join(', ')}`); return }
      // Open the document inline on the correspondence side…
      openCorrInline(corr)
      // …and scroll/highlight its card.
      setTimeout(() => {
        const element = document.getElementById(`corr-${corr.id}`) || document.querySelector(`[data-corr-number="${normalizedRef}"]`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          element.classList.add('highlighted')
          setTimeout(() => element.classList.remove('highlighted'), 3000)
        }
      }, 120)
    } else if (normalizedRef.startsWith('Note ')) {
      scrollToNote(parseInt(normalizedRef.replace('Note ', ''), 10))
    }
  }

  const renderNoteContent = (content) => {
    const referencePattern = /(?:Refer\s+)?(?:at\s+)?(?:quotation|bill|document|order|report|letter|voucher|circular|representation)?\s*(C\/\d+|Note\s+\d+)/gi
    const parts = []
    let lastIndex = 0
    let match
    while ((match = referencePattern.exec(content)) !== null) {
      if (match.index > lastIndex) parts.push({ type: 'text', content: content.substring(lastIndex, match.index) })
      parts.push({ type: 'reference', content: match[0], ref: match[1] })
      lastIndex = match.index + match[0].length
    }
    if (lastIndex < content.length) parts.push({ type: 'text', content: content.substring(lastIndex) })
    if (parts.length === 0) return <span>{content}</span>
    return parts.map((part, index) => part.type === 'reference' ? (
      <span key={index} className="reference-link" onClick={() => handleReferenceClick(part.ref)} title={`Click to open ${part.ref}`}>{part.content}</span>
    ) : <span key={index}>{part.content}</span>)
  }

  const pageLabel = (c) => {
    if (!c.startPage) return null
    return c.endPage && c.endPage !== c.startPage ? `p. ${c.startPage}–${c.endPage}` : `p. ${c.startPage}`
  }

  const showNoting = maximized !== 'correspondence'
  const showCorr = maximized !== 'noting'

  return (
    <div className="file-detail">
      <div className="file-detail-container">
        {/* Left Pane - File Info */}
        <div className="file-info-pane">
          {/* File Cover Section */}
          <div className="info-section">
            <div className="section-header" onClick={() => toggleSection('fileCover')}>
              <h3>File Cover</h3>
              {expandedSections.fileCover ? <FiChevronUp /> : <FiChevronDown />}
            </div>
            {expandedSections.fileCover && (
              <div className="section-content">
                <div className="info-item"><label>File Number</label><div className="file-number-display">{file.fileNumber}</div></div>
                <div className="info-item"><label>Subject</label><div className="file-subject-display">{file.subject}</div></div>
                <div className="info-item"><label>Section</label><div>{file.section}</div></div>
                <div className="info-item">
                  <label>Status</label>
                  <span className="status-badge" style={{ background: statusColor(file.status) }}>{prettyStatus(file.status)}</span>
                </div>
                {file.confidential && (
                  <div className="info-item"><label>Confidential</label><span className="confidential-badge"><FiLock /> CONFIDENTIAL</span></div>
                )}
                <div className="info-item"><label>Created</label><div>{new Date(file.createdDate).toLocaleDateString()}</div></div>
                <div className="info-item"><label>Last Modified</label><div>{new Date(file.lastModified).toLocaleDateString()}</div></div>
              </div>
            )}
          </div>

          {/* Draft notes (review #8) */}
          {!isAdmin && draftNotes.length > 0 && (
            <div className="info-section">
              <div className="section-header"><h3>Drafts ({draftNotes.length})</h3></div>
              <div className="section-content">
                <div className="draft-list">
                  {draftNotes.map((n) => (
                    <div key={n.id} className="draft-item">
                      <span style={{ cursor: 'pointer', flex: 1 }} onClick={() => scrollToNote(n.noteNumber)} title="Go to draft note">Note {n.noteNumber}</span>
                      {isHolder && n.author?.id === user?.id && (
                        <button className="corr-btn" style={{ width: 'auto', padding: '2px 8px' }} onClick={() => handleSubmitDraft(n.id)}>Submit</button>
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
                        <div className="movement-action">{mov.action}</div>
                        <div className="movement-route">
                          {mov.from.name}{mov.from.section ? ` · ${mov.from.section}` : ''}
                          {' → '}
                          {mov.to.name ? `${mov.to.name}${mov.to.section ? ` · ${mov.to.section}` : ''}` : (mov.to.section || '—')}
                        </div>
                        <div className="movement-date">{new Date(mov.date).toLocaleString()}</div>
                        {mov.remarks && <div className="movement-remarks">{mov.remarks}</div>}
                      </div>
                    </div>
                  )) : <div className="no-movements">No movements yet</div>}
                </div>
              </div>
            )}
          </div>

          {/* Approval Flow */}
          {file.steps && file.steps.length > 0 && (
            <div className="info-section">
              <div className="section-header"><h3>Approval Flow</h3></div>
              <div className="section-content">
                {file.steps.map((s) => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 0', borderBottom: '1px solid #edf2f7' }}>
                    <span style={{ minWidth: 22, height: 22, borderRadius: '50%', background: stepColor(s.status), color: '#fff', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.stepOrder}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>
                        {s.assigneeName} <span style={{ color: '#718096', fontWeight: 400 }}>({s.roleAtStep})</span>
                        {file.currentAssignee === s.assigneeId && s.status === 'PENDING' && (
                          <span style={{ marginLeft: 6, fontSize: 11, color: '#ed8936' }}>● current</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: '#4a5568' }}>
                        {prettyStatus(s.status)}
                        {s.actedAt ? ` · ${new Date(s.actedAt).toLocaleDateString()}` : ''}
                        {s.signatureName && s.status !== 'PENDING' ? ` · ✍ ${s.signatureName}` : ''}
                      </div>
                      {s.remarks && s.status !== 'PENDING' && <div style={{ fontSize: 12, color: '#718096', fontStyle: 'italic' }}>{s.remarks}</div>}
                    </div>
                    {!isAdmin && s.status === 'PENDING' && file.currentAssignee !== s.assigneeId && (
                      <button onClick={() => handleRemoveStep(s.id)} title="Remove reviewer" style={{ border: 'none', background: 'transparent', color: '#e53e3e', cursor: 'pointer', fontSize: 14 }}>✕</button>
                    )}
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
              {canAddNote
                ? <button className="action-btn primary" onClick={() => setShowNoteModal(true)}><FiPlus /> Add Note</button>
                : <div style={{ fontSize: 12, color: '#a0aec0', padding: '4px 2px' }}>You can add a note only while you hold this file.</div>}
              <button className="action-btn" onClick={() => setShowCorrModal(true)}><FiPlus /> Add Correspondence</button>
              <button className="action-btn" onClick={() => setShowForwardModal(true)}><FiSend /> Forward File</button>
              <button className="action-btn" onClick={() => setShowAssignModal(true)}><FiUserCheck /> Assign Roles</button>
              <button className="action-btn" onClick={() => setShowReviewModal(true)}><FiFile /> Review &amp; Approve</button>
              <button className="action-btn" onClick={() => openPrint(file.id, 'noting')}><FiPrinter /> Print Noting</button>
              <button className="action-btn" onClick={() => openPrint(file.id, 'correspondence')}><FiPrinter /> Print Correspondence</button>
              {file.status === 'UNDER_REVIEW' && <button className="action-btn" onClick={() => openAction('md')}><FiFile /> MD Offline Approval</button>}
              {file.status === 'APPROVED' && <button className="action-btn" onClick={() => openAction('route')}><FiSend /> Route to Department</button>}
              {file.status === 'ROUTED' && <button className="action-btn" onClick={() => openAction('return')}><FiSend /> Return to Maker</button>}
              {file.status !== 'CLOSED' && file.status !== 'DRAFT' && (
                <>
                  <button className="action-btn" onClick={() => openAction('transfer')}><FiSend /> Transfer Dept</button>
                  <button className="action-btn" onClick={() => openAction('close')}><FiLock /> Close File</button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right Pane - Main Content */}
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
                          {note.status === 'DRAFT' && <span className="draft-badge">Draft</span>}
                        </div>
                        <div className="note-date">{new Date(note.date).toLocaleString()}</div>
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
                        <div className="note-author-left">
                          {note.noteNumber > 1 && (
                            <div className="author-info">
                              <FiUser className="author-icon" />
                              <div>
                                <div className="author-name">{note.author.name}</div>
                                <div className="author-designation">{note.author.designation}</div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="note-author-right">
                          {note.noteNumber === 1 && (
                            <div className="author-info">
                              <FiUser className="author-icon" />
                              <div>
                                <div className="author-name">{note.author.name}</div>
                                <div className="author-designation">{note.author.designation}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      {note.status && (
                        <div className="note-status">
                          Status: <span className="status-text">{prettyStatus(note.status)}</span>
                          {note.isSuoMoto && <span style={{ marginLeft: 8, color: '#805ad5' }}>· Suo-moto</span>}
                        </div>
                      )}
                      {note.approvals && note.approvals.length > 0 && (
                        <div className="note-status">
                          {note.approvals.map((a, i) => (
                            <div key={i} style={{ color: a.status === 'PENDING' ? '#ed8936' : '#38b2ac' }}>
                              Para {a.paragraph}: {a.status === 'PENDING' ? `assigned to ${a.assignedTo} (pending)` : `approved by ${a.approvedBy}`}
                            </div>
                          ))}
                        </div>
                      )}
                      {note.checkerComments && note.checkerComments.length > 0 && (
                        <div style={{ marginTop: 6, fontSize: 12 }}>
                          {note.checkerComments.map((c, i) => (
                            <div key={i} style={{ color: '#4a5568', marginTop: 2 }}>💬 <strong>{c.checkerName}:</strong> {c.comment}</div>
                          ))}
                        </div>
                      )}
                      {note.author?.id === user?.id && isHolder && editingNote !== note.id && (note.status === 'DRAFT' || file.status === 'REVERTED') && (
                        <button className="corr-btn" style={{ marginTop: 6, marginRight: 6, width: 'auto', display: 'inline-flex' }} onClick={() => startEdit(note)}>✎ Edit</button>
                      )}
                      {note.status === 'DRAFT' && note.author?.id === user?.id && isHolder && (
                        <button className="corr-btn" style={{ marginTop: 6, marginRight: 6, width: 'auto', display: 'inline-flex', background: '#c6f6d5', color: '#22543d', borderColor: '#9ae6b4' }} onClick={() => handleSubmitDraft(note.id)}>✓ Submit note</button>
                      )}
                      {file.status !== 'CLOSED' && note.status !== 'DRAFT' && (
                        <button className="corr-btn" style={{ marginTop: 6 }} onClick={() => handleComment(note.id)}>＋ Comment</button>
                      )}
                    </div>
                  ))}
                  {canAddNote && <button className="add-note-btn" onClick={() => setShowNoteModal(true)}><FiPlus /> Add New Note</button>}
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

                {/* Inline document preview (review #3) */}
                {preview && (
                  <div className="corr-preview">
                    <div className="corr-preview-head">
                      <span>{preview.corr.number} — {preview.corr.title}</span>
                      <button className="corr-btn" style={{ flex: 'none' }} onClick={clearPreview}>Close</button>
                    </div>
                    {preview.url && preview.isImage ? (
                      <div style={{ padding: 8, textAlign: 'center', background: '#fff', maxHeight: 360, overflow: 'auto' }}>
                        <img src={preview.url} alt={preview.corr.title} style={{ maxWidth: '100%', maxHeight: 340 }} />
                      </div>
                    ) : preview.url && preview.renderable ? (
                      <iframe src={preview.url} title={`Preview ${preview.corr.number}`} />
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
                        <div key={corr.id} id={`corr-${corr.id}`} className="corr-card" data-corr-number={corr.number}>
                          <div className="corr-number">{corr.number}</div>
                          <div className="corr-content">
                            <div className="corr-type">{corr.type}</div>
                            <div className="corr-title">{corr.title}</div>
                            <div className="corr-meta">
                              {corr.inwardDate && <span>Inward: {new Date(corr.inwardDate).toLocaleDateString()}</span>}
                              {corr.inwardNumber && <span>No: {corr.inwardNumber}</span>}
                              {pageLabel(corr) && <span className="corr-pages">{pageLabel(corr)}{corr.pageCount ? ` (${corr.pageCount} pg)` : ''}</span>}
                            </div>
                            {corr.storageKey && (
                              <div className="corr-actions">
                                <button className="corr-btn" onClick={() => openCorrInline(corr)}><FiEye /> Open</button>
                                <button className="corr-btn" onClick={() => downloadCorrespondence(file.id, corr.id, corr.originalName || `${corr.number.replace('/', '-')}`)}><FiDownload /> Download</button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <button className="add-corr-btn" onClick={() => setShowCorrModal(true)}><FiPlus /> Add Correspondence</button>
                    </>
                  ) : (
                    <div className="empty-correspondence">
                      <p>No correspondence added yet</p>
                      <button className="add-corr-btn" onClick={() => setShowCorrModal(true)}><FiPlus /> Add First Correspondence</button>
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
      {showCorrModal && <AddCorrespondenceModal file={file} onClose={() => setShowCorrModal(false)} onSaved={refresh} />}
      {showForwardModal && <ForwardFileModal file={file} onClose={() => setShowForwardModal(false)} onSaved={refresh} />}
      {showReviewModal && <ReviewModal file={file} onClose={() => setShowReviewModal(false)} onSaved={refresh} />}
      {showAssignModal && <AssignRolesModal file={file} onClose={() => setShowAssignModal(false)} onSaved={(f) => (f ? setFile(f) : refresh())} />}
      {activeAction === 'route' && (
        <ActionModal
          title="Route to Actionable Department" submitLabel="Route"
          onClose={() => setActiveAction(null)}
          fields={[
            { name: 'toUserId', label: 'Send to', type: 'select', required: true, options: userOptions.map((u) => ({ value: u.id, label: `${u.name} — ${u.section} (${u.role})` })) },
            { name: 'remarks', label: 'Instructions', type: 'textarea' },
          ]}
          onSubmit={async (v) => setFile(await routeToDept(fileId, { toUserId: v.toUserId, remarks: v.remarks }))}
        />
      )}
      {activeAction === 'return' && (
        <ActionModal
          title="Return to Maker" submitLabel="Return"
          onClose={() => setActiveAction(null)}
          fields={[{ name: 'remarks', label: 'Implementation comments', type: 'textarea' }]}
          onSubmit={async (v) => setFile(await returnToMaker(fileId, { remarks: v.remarks }))}
        />
      )}
      {activeAction === 'transfer' && (
        <ActionModal
          title="Transfer to Another Department" submitLabel="Transfer"
          onClose={() => setActiveAction(null)}
          fields={[
            { name: 'toSection', label: 'Department', type: 'select', required: true, options: deptNames.filter((s) => s !== file.section).map((s) => ({ value: s, label: s })) },
            { name: 'reason', label: 'Reason', type: 'textarea', hint: 'The file number stays the same on transfer.' },
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
          title="Upload Offline MD Approval (PDF)" submitLabel="Upload & Approve"
          onClose={() => setActiveAction(null)}
          fields={[
            { name: 'file', label: 'Scanned approval (PDF)', type: 'file', accept: 'application/pdf', required: true },
            { name: 'remarks', label: 'Remarks', type: 'text' },
          ]}
          onSubmit={async (v) => setFile(await uploadMdApproval(fileId, { remarks: v.remarks, file: v.file }))}
        />
      )}
    </div>
  )
}

export default FileDetail
