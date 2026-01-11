import React, { useState } from 'react'
import { FiX, FiSend } from 'react-icons/fi'
import { currentUser } from '../data/dummyData'
import './Modal.css'

const AddNoteModal = ({ file, onClose }) => {
  const [noteContent, setNoteContent] = useState('')
  const [selectedCorr, setSelectedCorr] = useState([])
  const [selectedNotes, setSelectedNotes] = useState([])
  const [forwardTo, setForwardTo] = useState('')
  const [isDraft, setIsDraft] = useState(false)
  const [searchApprovedFiles, setSearchApprovedFiles] = useState('')
  const [approvedFilesResults, setApprovedFilesResults] = useState([])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isDraft) {
      alert('Draft saved successfully! You can continue working on it later. (Demo mode)')
    } else {
      alert('Note submitted successfully! (Demo mode)')
    }
    onClose()
  }

  const handleSaveDraft = () => {
    setIsDraft(true)
    alert('Draft saved! You can continue working on it later. (Demo mode)')
    // In real app, this would save as draft
  }

  const handleSearchApprovedFiles = (searchTerm) => {
    setSearchApprovedFiles(searchTerm)
    if (searchTerm.length > 2) {
      // In real app, this would search approved files
      // For demo, show mock results
      const mockResults = files.filter(f => 
        f.status === 'Approved' && 
        (f.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
         f.fileNumber.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      setApprovedFilesResults(mockResults)
    } else {
      setApprovedFilesResults([])
    }
  }

  const handleCopyReference = (approvedFile) => {
    // Copy reference to note content
    const reference = `Refer approved file ${approvedFile.fileNumber}: ${approvedFile.subject}`
    setNoteContent(prev => prev + '\n' + reference)
    setSearchApprovedFiles('')
    setApprovedFilesResults([])
  }

  const toggleCorr = (corrNumber) => {
    setSelectedCorr(prev => 
      prev.includes(corrNumber)
        ? prev.filter(c => c !== corrNumber)
        : [...prev, corrNumber]
    )
  }

  const toggleNote = (noteNumber) => {
    setSelectedNotes(prev => 
      prev.includes(noteNumber)
        ? prev.filter(n => n !== noteNumber)
        : [...prev, noteNumber]
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Note</h2>
          <button className="modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Note Content *</label>
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Enter your note here. You can reference correspondence (e.g., Refer C/1) or previous notes (e.g., Refer Note 1)..."
              rows={12}
              required={!isDraft}
            />
          </div>

          <div className="form-group">
            <label>Search Approved Files</label>
            <div className="search-approved-files">
              <input
                type="text"
                value={searchApprovedFiles}
                onChange={(e) => handleSearchApprovedFiles(e.target.value)}
                placeholder="Search approved files to copy references..."
                className="search-input"
              />
              {approvedFilesResults.length > 0 && (
                <div className="approved-files-results">
                  {approvedFilesResults.map(af => (
                    <div 
                      key={af.id} 
                      className="approved-file-item"
                      onClick={() => handleCopyReference(af)}
                    >
                      <div className="file-ref">{af.fileNumber}</div>
                      <div className="file-subject">{af.subject}</div>
                      <small>Click to copy reference</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <small>Search and copy references from approved files</small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Reference Correspondence</label>
              <div className="reference-list">
                {file.correspondence.map(corr => (
                  <label key={corr.id} className="reference-item">
                    <input
                      type="checkbox"
                      checked={selectedCorr.includes(corr.number)}
                      onChange={() => toggleCorr(corr.number)}
                    />
                    <span>{corr.number} - {corr.title}</span>
                  </label>
                ))}
                {file.correspondence.length === 0 && (
                  <div className="empty-ref">No correspondence available</div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Reference Previous Notes</label>
              <div className="reference-list">
                {file.notes.map(note => (
                  <label key={note.id} className="reference-item">
                    <input
                      type="checkbox"
                      checked={selectedNotes.includes(note.noteNumber)}
                      onChange={() => toggleNote(note.noteNumber)}
                    />
                    <span>Note {note.noteNumber}</span>
                  </label>
                ))}
                {file.notes.length === 0 && (
                  <div className="empty-ref">No previous notes</div>
                )}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Forward To (Optional)</label>
            <input
              type="text"
              value={forwardTo}
              onChange={(e) => setForwardTo(e.target.value)}
              placeholder="Select recipient..."
            />
            <small>Leave empty to save as draft</small>
          </div>

          <div className="form-group">
            <label>Author</label>
            <div className="author-display">
              {currentUser.name} - {currentUser.designation}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="button" 
              className="btn-draft" 
              onClick={handleSaveDraft}
            >
              Save Draft
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              onClick={() => setIsDraft(false)}
            >
              <FiSend /> {isDraft ? 'Submit Note' : 'Submit & Forward'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddNoteModal
