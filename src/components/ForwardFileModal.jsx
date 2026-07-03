import React, { useEffect, useState } from 'react'
import { FiX, FiSend, FiUser } from 'react-icons/fi'
import { listUsers, stepRoleForUser } from '../api/users'
import { forwardFile, addReviewer } from '../api/workflow'
import './Modal.css'

const SECTIONS = ['Administration', 'Accounts', 'Legal', 'Audit', 'Finance', 'Engineering']

const ForwardFileModal = ({ file, onClose, onSaved }) => {
  const [users, setUsers] = useState([])
  const [selectedSection, setSelectedSection] = useState('')
  const [recipientOrder, setRecipientOrder] = useState([])
  const [remarks, setRemarks] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // Under review => we're adding reviewers to an existing chain; otherwise planning the flow.
  const addMode = file.status === 'UNDER_REVIEW'

  useEffect(() => {
    listUsers().then(setUsers).catch((e) => setError(e.message))
  }, [])

  const filteredUsers = selectedSection ? users.filter((u) => u.section === selectedSection) : users

  const toggleUser = (userId) => {
    setRecipientOrder((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const moveRecipient = (index, direction) => {
    const order = [...recipientOrder]
    if (direction === 'up' && index > 0) [order[index], order[index - 1]] = [order[index - 1], order[index]]
    else if (direction === 'down' && index < order.length - 1) [order[index], order[index + 1]] = [order[index + 1], order[index]]
    setRecipientOrder(order)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (recipientOrder.length === 0) { setError('Select at least one recipient'); return }
    setSubmitting(true)
    setError(null)
    try {
      const recipients = recipientOrder.map((id) => {
        const u = users.find((x) => x.id === id)
        return { userId: id, role: stepRoleForUser(u?.role) }
      })
      if (addMode) {
        // append each reviewer in order
        for (const r of recipients) {
          // eslint-disable-next-line no-await-in-loop
          await addReviewer(file.id, r)
        }
      } else {
        await forwardFile(file.id, { recipients, remarks })
      }
      onSaved && onSaved()
      onClose()
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{addMode ? 'Add Reviewer' : 'Forward File for Review'}</h2>
          <button className="modal-close" onClick={onClose}><FiX /></button>
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
            <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)}>
              <option value="">All Sections</option>
              {SECTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
          </div>

          <div className="form-group">
            <label>{addMode ? 'Reviewers to add *' : 'Recipient chain (in order) *'}</label>
            <small style={{ display: 'block', marginBottom: 8, color: '#718096' }}>
              {addMode ? 'They are appended to the end of the review chain.' : 'Reviewers act in this order (sequential). Reorder below.'}
            </small>
            <div className="users-list">
              {filteredUsers.map((user) => (
                <label key={user.id} className="user-item">
                  <input type="checkbox" checked={recipientOrder.includes(user.id)} onChange={() => toggleUser(user.id)} />
                  <div className="user-info">
                    <FiUser className="user-icon" />
                    <div>
                      <div className="user-name">{user.name}</div>
                      <div className="user-designation">{user.designation} - {user.section} · {user.role}</div>
                    </div>
                  </div>
                </label>
              ))}
              {filteredUsers.length === 0 && <div className="empty-ref">No users found</div>}
            </div>

            {recipientOrder.length > 0 && (
              <div className="recipient-order-section">
                <label>Order</label>
                <div className="recipient-order-list">
                  {recipientOrder.map((userId, index) => {
                    const user = users.find((u) => u.id === userId)
                    return user ? (
                      <div key={userId} className="recipient-order-item">
                        <span className="order-number">{index + 1}</span>
                        <span className="order-name">{user.name} <em style={{ color: '#718096' }}>({stepRoleForUser(user.role)})</em></span>
                        {!addMode && (
                          <div className="order-buttons">
                            <button type="button" onClick={() => moveRecipient(index, 'up')} disabled={index === 0} className="order-btn">↑</button>
                            <button type="button" onClick={() => moveRecipient(index, 'down')} disabled={index === recipientOrder.length - 1} className="order-btn">↓</button>
                          </div>
                        )}
                      </div>
                    ) : null
                  })}
                </div>
              </div>
            )}
          </div>

          {!addMode && (
            <div className="form-group">
              <label>Remarks/Instructions</label>
              <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Add any remarks or instructions for the reviewers..." rows={3} />
            </div>
          )}

          {error && <div className="form-error" style={{ color: '#e53e3e', marginBottom: 12 }}>{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              <FiSend /> {submitting ? 'Working…' : addMode ? 'Add Reviewer(s)' : 'Forward File'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ForwardFileModal
