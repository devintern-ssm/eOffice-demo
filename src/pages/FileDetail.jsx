import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  FiFile, FiPlus, FiSend, FiLock, FiPrinter, FiClock, 
  FiUser, FiChevronDown, FiChevronUp, FiDownload, FiEye
} from 'react-icons/fi'
import { getFileById, users } from '../data/dummyData'
import AddNoteModal from '../components/AddNoteModal'
import AddCorrespondenceModal from '../components/AddCorrespondenceModal'
import ForwardFileModal from '../components/ForwardFileModal'
import ReviewModal from '../components/ReviewModal'
import './FileDetail.css'

const FileDetail = () => {
  const { fileId } = useParams()
  const file = getFileById(fileId)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [showCorrModal, setShowCorrModal] = useState(false)
  const [showForwardModal, setShowForwardModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    fileCover: true,
    movement: false
  })

  if (!file) {
    return (
      <div className="file-detail">
        <div className="error-state">
          <h2>File not found</h2>
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return '#48bb78'
      case 'Under Review': return '#ed8936'
      case 'Approved': return '#38b2ac'
      case 'Closed': return '#718096'
      default: return '#a0aec0'
    }
  }

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
                    {file.status}
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
            <button className="action-btn">
              <FiPrinter /> Print
            </button>
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
                      Status: <span className="status-text">{note.status}</span>
                    </div>
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
                        <div className="corr-actions">
                          <button className="corr-btn">
                            <FiEye /> View
                          </button>
                          <button className="corr-btn">
                            <FiDownload /> Download
                          </button>
                        </div>
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
        />
      )}
      {showCorrModal && (
        <AddCorrespondenceModal
          file={file}
          onClose={() => setShowCorrModal(false)}
        />
      )}
      {showForwardModal && (
        <ForwardFileModal
          file={file}
          onClose={() => setShowForwardModal(false)}
        />
      )}
      {showReviewModal && (
        <ReviewModal
          file={file}
          onClose={() => setShowReviewModal(false)}
        />
      )}
    </div>
  )
}

export default FileDetail
