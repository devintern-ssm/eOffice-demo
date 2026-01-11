import React, { useState } from 'react'
import { FiX, FiSend, FiUser } from 'react-icons/fi'
import { users, sections } from '../data/dummyData'
import './Modal.css'

const ForwardFileModal = ({ file, onClose }) => {
  const [selectedSection, setSelectedSection] = useState('')
  const [selectedUsers, setSelectedUsers] = useState([])
  const [remarks, setRemarks] = useState('')
  const [priority, setPriority] = useState('Normal')
  const [recipientOrder, setRecipientOrder] = useState([])

  const filteredUsers = selectedSection
    ? users.filter(u => u.section === selectedSection)
    : users

  const handleSubmit = (e) => {
    e.preventDefault()
    if (selectedUsers.length === 0) {
      alert('Please select at least one recipient')
      return
    }
    // In real app, this would forward the file
    alert(`File forwarded to ${selectedUsers.length} recipient(s)! (Demo mode)`)
    onClose()
  }

  const toggleUser = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        setRecipientOrder(prevOrder => prevOrder.filter(id => id !== userId))
        return prev.filter(u => u !== userId)
      } else {
        setRecipientOrder(prevOrder => [...prevOrder, userId])
        return [...prev, userId]
      }
    })
  }

  const moveRecipient = (index, direction) => {
    const newOrder = [...recipientOrder]
    if (direction === 'up' && index > 0) {
      [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]]
    } else if (direction === 'down' && index < newOrder.length - 1) {
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]]
    }
    setRecipientOrder(newOrder)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Forward File</h2>
          <button className="modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>File</label>
            <div className="file-info-display">
              <strong>{file.fileNumber}</strong>
              <div>{file.subject}</div>
            </div>
          </div>

          <div className="form-group">
            <label>Select Section</label>
            <select
              value={selectedSection}
              onChange={(e) => {
                setSelectedSection(e.target.value)
                setSelectedUsers([])
              }}
            >
              <option value="">All Sections</option>
              {sections.map(section => (
                <option key={section} value={section}>{section}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Select Recipients *</label>
            <small style={{ display: 'block', marginBottom: '8px', color: '#718096' }}>
              Recipients can be reordered. Order can be changed by any recipient later.
            </small>
            <div className="users-list">
              {filteredUsers.map(user => (
                <label key={user.id} className="user-item">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => toggleUser(user.id)}
                  />
                  <div className="user-info">
                    <FiUser className="user-icon" />
                    <div>
                      <div className="user-name">{user.name}</div>
                      <div className="user-designation">{user.designation} - {user.section}</div>
                    </div>
                  </div>
                </label>
              ))}
              {filteredUsers.length === 0 && (
                <div className="empty-ref">No users found</div>
              )}
            </div>
            
            {recipientOrder.length > 1 && (
              <div className="recipient-order-section">
                <label>Recipient Order (Can be changed later)</label>
                <div className="recipient-order-list">
                  {recipientOrder.map((userId, index) => {
                    const user = users.find(u => u.id === userId)
                    return user ? (
                      <div key={userId} className="recipient-order-item">
                        <span className="order-number">{index + 1}</span>
                        <span className="order-name">{user.name}</span>
                        <div className="order-buttons">
                          <button
                            type="button"
                            onClick={() => moveRecipient(index, 'up')}
                            disabled={index === 0}
                            className="order-btn"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveRecipient(index, 'down')}
                            disabled={index === recipientOrder.length - 1}
                            className="order-btn"
                          >
                            ↓
                          </button>
                        </div>
                      </div>
                    ) : null
                  })}
                </div>
                <small>Recipients can change this order later</small>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="Normal">Normal</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          <div className="form-group">
            <label>Remarks/Instructions</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add any remarks or instructions for the recipient..."
              rows={4}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <FiSend /> Forward File
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ForwardFileModal
