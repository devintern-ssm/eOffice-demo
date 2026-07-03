import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  FiFile, FiPlus, FiSend, FiLock, FiPrinter, FiClock, 
  FiUser, FiChevronDown, FiChevronUp, FiDownload, FiEye
} from 'react-icons/fi'
import { getFile } from '../api/files'
import { viewCorrespondence, downloadCorrespondence } from '../api/correspondence'
import { removeStep } from '../api/workflow'
import { routeToDept, returnToMaker, transferFile, closeFile } from '../api/lifecycle'
import { uploadMdApproval, addNoteComment } from '../api/approvals'
import { openPrint } from '../api/print'
import { listUsers } from '../api/users'
import ActionModal from '../components/ActionModal'
import { statusColor, prettyStatus } from '../utils/status'
import AddNoteModal from '../components/AddNoteModal'
import AddCorrespondenceModal from '../components/AddCorrespondenceModal'
import ForwardFileModal from '../components/ForwardFileModal'
import ReviewModal from '../components/ReviewModal'
import './FileDetail.css'

const FileDetail = () => {
  const { fileId } = useParams()
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [showCorrModal, setShowCorrModal] = useState(false)
  const [showForwardModal, setShowForwardModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [activeAction, setActiveAction] = useState(null) // 'route' | 'return' | 'transfer' | 'close' | 'md'
  const [userOptions, setUserOptions] = useState([])
  const [expandedSections, setExpandedSections] = useState({
    fileCover: true,
    movement: false
  })

  useEffect(() => {
    let active = true
    setLoading(true)
    getFile(fileId)
      .then((data) => { if (active) { setFile(data); setError(null) } })
      .catch((e) => { if (active) setError(e.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [fileId])

  const refresh = () => getFile(fileId).then((d) => setFile(d)).catch(() => {})

  const stepColor = (s) => ({ PENDING: '#a0aec0', CHECKED: '#4299e1', APPROVED: '#38b2ac', REVERTED: '#e53e3e', SKIPPED: '#a0aec0' }[s] || '#a0aec0')

  const handleRemoveStep = async (stepId) => {
    try {
      await removeStep(fileId, stepId)
      refresh()
    } catch (e) {
      alert(e.message)
    }
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

  if (loading) {
    return (
      <div className="file-detail">
        <div className="error-state"><h2>Loading file…</h2></div>
      </div>
    )
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

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleReferenceClick = (ref) => {
    // Normalize the reference (handle C/1, C/12, etc.)
    const normalizedRef = ref.trim()
    
    if (normalizedRef.startsWith('C/')) {
      // Check if file has correspondence
      if (!file.correspondence || file.correspondence.length === 0) {
        alert('No correspondence available in this file')
        return
      }
      
      // Find correspondence by number (e.g., "C/1", "C/12")
      const corr = file.correspondence.find(c => c.number === normalizedRef)
      if (!corr) {
        alert(`Correspondence ${normalizedRef} not found. Available: ${file.correspondence.map(c => c.number).join(', ')}`)
        return
      }
      
      // Wait a bit for DOM to be ready, then find and scroll to element
      setTimeout(() => {
        // Try multiple ways to find the element
        let element = document.getElementById(`corr-${corr.id}`)
        if (!element) {
          // Try finding by data attribute
          element = document.querySelector(`[data-corr-number="${normalizedRef}"]`)
        }
        
        if (element) {
          // First, make sure the correspondence side is visible
          const correspondenceSide = document.querySelector('.correspondence-side')
          if (correspondenceSide) {
            // Scroll the correspondence side into view first
            correspondenceSide.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
          }
          
          // Then scroll within the correspondence container
          const container = document.querySelector('.correspondence-container')
          if (container) {
            // Wait a bit more for the scroll to start
            setTimeout(() => {
              // Calculate scroll position
              const elementTop = element.offsetTop
              const containerHeight = container.clientHeight
              const elementHeight = element.offsetHeight
              
              // Center the element in the container
              const scrollTop = elementTop - (containerHeight / 2) + (elementHeight / 2)
              
              container.scrollTo({ 
                top: Math.max(0, scrollTop), 
                behavior: 'smooth' 
              })
              
              // Highlight the element
              element.classList.add('highlighted')
              
              setTimeout(() => {
                element.classList.remove('highlighted')
              }, 3000)
            }, 300)
          } else {
            // Fallback: scroll element into view
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            element.classList.add('highlighted')
            setTimeout(() => {
              element.classList.remove('highlighted')
            }, 3000)
          }
        } else {
          console.error('Correspondence element not found:', `corr-${corr.id}`, 'Reference:', normalizedRef)
          alert(`Could not find correspondence ${normalizedRef} in the page. Please scroll down to see the Correspondence Side.`)
        }
      }, 100)
    } else if (normalizedRef.startsWith('Note ')) {
      const noteNumber = parseInt(normalizedRef.replace('Note ', ''))
      const note = file.notes.find(n => n.noteNumber === noteNumber)
      if (note) {
        const element = document.getElementById(`note-${note.id}`)
        if (element) {
          // Scroll the notes container
          const container = document.querySelector('.notes-container')
          if (container) {
            const containerRect = container.getBoundingClientRect()
            const elementRect = element.getBoundingClientRect()
            const scrollTop = container.scrollTop + (elementRect.top - containerRect.top) - (containerRect.height / 2) + (elementRect.height / 2)
            container.scrollTo({ top: scrollTop, behavior: 'smooth' })
          } else {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
          
          element.classList.add('highlighted')
          
          setTimeout(() => {
            element.classList.remove('highlighted')
          }, 3000)
        }
      }
    }
  }

  const renderNoteContent = (content) => {
    // More flexible regex to catch various patterns:
    // - "Refer C/1", "Refer C/12"
    // - "at C/1", "at C/12"
    // - "quotation C/1", "bill C/1"
    // - "C/1", "C/12" (standalone)
    // - "Refer Note 1", "Refer Note 2"
    // - "Note 1", "Note 2" (standalone)
    const referencePattern = /(?:Refer\s+)?(?:at\s+)?(?:quotation|bill|document|order|report|letter|voucher|circular|representation)?\s*(C\/\d+|Note\s+\d+)/gi
    
    const parts = []
    let lastIndex = 0
    let match
    
    while ((match = referencePattern.exec(content)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: content.substring(lastIndex, match.index) })
      }
      
      // Add the reference
      const ref = match[1] // The actual reference (C/1 or Note 1)
      parts.push({ 
        type: 'reference', 
        content: match[0], // The full matched text
        ref: ref 
      })
      
      lastIndex = match.index + match[0].length
    }
    
    // Add remaining text
    if (lastIndex < content.length) {
      parts.push({ type: 'text', content: content.substring(lastIndex) })
    }
    
    // If no references found, return the content as-is
    if (parts.length === 0) {
      return <span>{content}</span>
    }
    
    return parts.map((part, index) => {
      if (part.type === 'reference') {
        return (
          <span
            key={index}
            className="reference-link"
            onClick={() => handleReferenceClick(part.ref)}
            title={`Click to view ${part.ref}`}
          >
            {part.content}
          </span>
        )
      }
      return <span key={index}>{part.content}</span>
    })
  }

  const getStatusColor = statusColor

  return (
    <div className="file-detail">
      <div className="file-detail-container">
        {/* Left Pane - File Info */}
        <div className="file-info-pane">
          {/* File Cover Section */}
          <div className="info-section">
            <div 
              className="section-header"
              onClick={() => toggleSection('fileCover')}
            >
              <h3>File Cover</h3>
              {expandedSections.fileCover ? <FiChevronUp /> : <FiChevronDown />}
            </div>
            {expandedSections.fileCover && (
              <div className="section-content">
                <div className="info-item">
                  <label>File Number</label>
                  <div className="file-number-display">{file.fileNumber}</div>
                </div>
                <div className="info-item">
                  <label>Subject</label>
                  <div className="file-subject-display">{file.subject}</div>
                </div>
                <div className="info-item">
                  <label>Section</label>
                  <div>{file.section}</div>
                </div>
                <div className="info-item">
                  <label>Status</label>
                  <span 
                    className="status-badge"
                    style={{ background: getStatusColor(file.status) }}
                  >
                    {prettyStatus(file.status)}
                  </span>
                </div>
                {file.confidential && (
                  <div className="info-item">
                    <label>Confidential</label>
                    <span className="confidential-badge">
                      <FiLock /> CONFIDENTIAL
                    </span>
                  </div>
                )}
                <div className="info-item">
                  <label>Created</label>
                  <div>{new Date(file.createdDate).toLocaleDateString()}</div>
                </div>
                <div className="info-item">
                  <label>Last Modified</label>
                  <div>{new Date(file.lastModified).toLocaleDateString()}</div>
                </div>
              </div>
            )}
          </div>

          {/* Movement Timeline */}
          <div className="info-section">
            <div 
              className="section-header"
              onClick={() => toggleSection('movement')}
            >
              <h3>File Movement</h3>
              {expandedSections.movement ? <FiChevronUp /> : <FiChevronDown />}
            </div>
            {expandedSections.movement && (
              <div className="section-content">
                <div className="movement-timeline">
                  {file.movements.length > 0 ? (
                    file.movements.map((mov, index) => (
                      <div key={mov.id} className="movement-item">
                        <div className="movement-dot"></div>
                        <div className="movement-content">
                          <div className="movement-action">{mov.action}</div>
                          <div className="movement-route">
                            {mov.from.name} → {mov.to.name}
                          </div>
                          <div className="movement-date">
                            {new Date(mov.date).toLocaleString()}
                          </div>
                          {mov.remarks && (
                            <div className="movement-remarks">{mov.remarks}</div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-movements">No movements yet</div>
                  )}
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
                    <span style={{ minWidth: 22, height: 22, borderRadius: '50%', background: stepColor(s.status), color: '#fff', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {s.stepOrder}
                    </span>
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
                      {s.remarks && s.status !== 'PENDING' && (
                        <div style={{ fontSize: 12, color: '#718096', fontStyle: 'italic' }}>{s.remarks}</div>
                      )}
                    </div>
                    {s.status === 'PENDING' && file.currentAssignee !== s.assigneeId && (
                      <button onClick={() => handleRemoveStep(s.id)} title="Remove reviewer" style={{ border: 'none', background: 'transparent', color: '#e53e3e', cursor: 'pointer', fontSize: 14 }}>✕</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="quick-actions">
            <button 
              className="action-btn primary"
              onClick={() => setShowNoteModal(true)}
            >
              <FiPlus /> Add Note
            </button>
            <button 
              className="action-btn"
              onClick={() => setShowCorrModal(true)}
            >
              <FiPlus /> Add Correspondence
            </button>
            <button 
              className="action-btn"
              onClick={() => setShowForwardModal(true)}
            >
              <FiSend /> Forward File
            </button>
            <button 
              className="action-btn"
              onClick={() => setShowReviewModal(true)}
            >
              <FiFile /> Review & Approve
            </button>
            <button className="action-btn" onClick={() => openPrint(file.id, 'noting')}>
              <FiPrinter /> Print Noting
            </button>
            <button className="action-btn" onClick={() => openPrint(file.id, 'correspondence')}>
              <FiPrinter /> Print Correspondence
            </button>
            {file.status === 'UNDER_REVIEW' && (
              <button className="action-btn" onClick={() => openAction('md')}>
                <FiFile /> MD Offline Approval
              </button>
            )}
            {file.status === 'APPROVED' && (
              <button className="action-btn" onClick={() => openAction('route')}>
                <FiSend /> Route to Department
              </button>
            )}
            {file.status === 'ROUTED' && (
              <button className="action-btn" onClick={() => openAction('return')}>
                <FiSend /> Return to Maker
              </button>
            )}
            {file.status !== 'CLOSED' && file.status !== 'DRAFT' && (
              <>
                <button className="action-btn" onClick={() => openAction('transfer')}>
                  <FiSend /> Transfer Dept
                </button>
                <button className="action-btn" onClick={() => openAction('close')}>
                  <FiLock /> Close File
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right Pane - Main Content (Two Sections) */}
        <div className="file-content-pane">
          {/* Noting Side (Top Half) */}
          <div className="noting-side">
            <div className="side-header">
              <h2>NOTING SIDE</h2>
            </div>
            <div className="notes-container">
              {file.notes.map(note => (
                <div key={note.id} id={`note-${note.id}`} className="note-card">
                  <div className="note-header">
                    <div className="note-number">Note {note.noteNumber}</div>
                    <div className="note-date">
                      {new Date(note.date).toLocaleString()}
                    </div>
                  </div>
                  <div className="note-content">
                    {renderNoteContent(note.content)}
                  </div>
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
                    <div className="note-status" style={{ color: '#38b2ac' }}>
                      Paragraph approvals: {note.approvals.map((a) => a.paragraph).join(', ')} (by {note.approvals[0].approvedBy})
                    </div>
                  )}
                  {note.checkerComments && note.checkerComments.length > 0 && (
                    <div style={{ marginTop: 6, fontSize: 12 }}>
                      {note.checkerComments.map((c, i) => (
                        <div key={i} style={{ color: '#4a5568', marginTop: 2 }}>💬 <strong>{c.checkerName}:</strong> {c.comment}</div>
                      ))}
                    </div>
                  )}
                  {file.status !== 'CLOSED' && (
                    <button className="corr-btn" style={{ marginTop: 6 }} onClick={() => handleComment(note.id)}>＋ Comment</button>
                  )}
                </div>
              ))}
              <button 
                className="add-note-btn"
                onClick={() => setShowNoteModal(true)}
              >
                <FiPlus /> Add New Note
              </button>
            </div>
          </div>

          {/* Correspondence Side (Bottom Half) */}
          <div className="correspondence-side">
            <div className="side-header">
              <h2>CORRESPONDENCE SIDE</h2>
            </div>
            <div className="correspondence-container">
              {file.correspondence && file.correspondence.length > 0 ? (
                <>
                  {file.correspondence.map(corr => (
                    <div key={corr.id} id={`corr-${corr.id}`} className="corr-card" data-corr-number={corr.number}>
                      <div className="corr-number">{corr.number}</div>
                      <div className="corr-content">
                        <div className="corr-type">{corr.type}</div>
                        <div className="corr-title">{corr.title}</div>
                        <div className="corr-meta">
                          {corr.inwardDate && (
                            <span>Inward: {new Date(corr.inwardDate).toLocaleDateString()}</span>
                          )}
                          {corr.inwardNumber && (
                            <span>No: {corr.inwardNumber}</span>
                          )}
                        </div>
                        {corr.storageKey && (
                          <div className="corr-actions">
                            <button className="corr-btn" onClick={() => viewCorrespondence(file.id, corr.id)}>
                              <FiEye /> View
                            </button>
                            <button
                              className="corr-btn"
                              onClick={() => downloadCorrespondence(file.id, corr.id, `${corr.number.replace('/', '-')}.pdf`)}
                            >
                              <FiDownload /> Download
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <button 
                    className="add-corr-btn"
                    onClick={() => setShowCorrModal(true)}
                  >
                    <FiPlus /> Add Correspondence
                  </button>
                </>
              ) : (
                <div className="empty-correspondence">
                  <p>No correspondence added yet</p>
                  <button 
                    className="add-corr-btn"
                    onClick={() => setShowCorrModal(true)}
                  >
                    <FiPlus /> Add First Correspondence
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showNoteModal && (
        <AddNoteModal
          file={file}
          onClose={() => setShowNoteModal(false)}
          onSaved={refresh}
        />
      )}
      {showCorrModal && (
        <AddCorrespondenceModal
          file={file}
          onClose={() => setShowCorrModal(false)}
          onSaved={refresh}
        />
      )}
      {showForwardModal && (
        <ForwardFileModal
          file={file}
          onClose={() => setShowForwardModal(false)}
          onSaved={refresh}
        />
      )}
      {showReviewModal && (
        <ReviewModal
          file={file}
          onClose={() => setShowReviewModal(false)}
          onSaved={refresh}
        />
      )}
      {activeAction === 'route' && (
        <ActionModal
          title="Route to Actionable Department"
          submitLabel="Route"
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
            { name: 'toSection', label: 'Department', type: 'select', required: true, options: ['Administration', 'Accounts', 'Legal', 'Audit', 'Finance', 'Engineering'].map((s) => ({ value: s, label: s })) },
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
