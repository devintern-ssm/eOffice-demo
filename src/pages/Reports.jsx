import React, { useState } from 'react'
import { FiFile, FiSearch, FiDownload, FiFilter } from 'react-icons/fi'
import { files } from '../data/dummyData'
import './Reports.css'

const Reports = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [sectionFilter, setSectionFilter] = useState('all')

  const sections = ['Administration', 'Accounts', 'Legal', 'Audit', 'Finance', 'Engineering']

  // Generate file logs
  const fileLogs = files.flatMap(file => {
    const logs = []
    
    // File creation log
    logs.push({
      id: `log-${file.id}-create`,
      fileId: file.id,
      fileNumber: file.fileNumber,
      subject: file.subject,
      action: 'File Created',
      user: file.maker?.name || 'Unknown',
      section: file.section,
      date: file.createdDate,
      details: `File created by ${file.maker?.name || 'Unknown'}`
    })

    // Movement logs
    file.movements.forEach(mov => {
      logs.push({
        id: `log-${file.id}-${mov.id}`,
        fileId: file.id,
        fileNumber: file.fileNumber,
        subject: file.subject,
        action: mov.action,
        user: mov.from.name,
        section: mov.from.section,
        date: mov.date,
        details: `From: ${mov.from.name} → To: ${mov.to.name}. ${mov.remarks || ''}`
      })
    })

    // Note logs
    file.notes.forEach(note => {
      logs.push({
        id: `log-${file.id}-note-${note.id}`,
        fileId: file.id,
        fileNumber: file.fileNumber,
        subject: file.subject,
        action: `Note ${note.noteNumber} ${note.status}`,
        user: note.author.name,
        section: file.section,
        date: note.date,
        details: `Note ${note.noteNumber} by ${note.author.name} - ${note.status}`
      })
    })

    return logs
  })

  const filteredLogs = fileLogs.filter(log => {
    const matchesSearch = 
      log.fileNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSection = sectionFilter === 'all' || log.section === sectionFilter
    return matchesSearch && matchesSection
  }).sort((a, b) => new Date(b.date) - new Date(a.date))

  const handleExport = () => {
    alert('Exporting file logs... (Demo mode)')
  }

  return (
    <div className="reports-page">
      <div className="page-header">
        <h1>File Reports & Logs</h1>
        <button className="btn-primary" onClick={handleExport}>
          <FiDownload /> Export Logs
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by file number, subject, or user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <FiFilter className="filter-icon" />
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Sections</option>
            {sections.map(section => (
              <option key={section} value={section}>{section}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      <div className="reports-container">
        <div className="reports-summary">
          <div className="summary-card">
            <div className="summary-label">Total Files</div>
            <div className="summary-value">{files.length}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Total Actions</div>
            <div className="summary-value">{fileLogs.length}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Active Files</div>
            <div className="summary-value">
              {files.filter(f => f.status !== 'Closed').length}
            </div>
          </div>
        </div>

        <div className="logs-table-container">
          <table className="logs-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>File Number</th>
                <th>Subject</th>
                <th>Action</th>
                <th>User</th>
                <th>Section</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map(log => (
                  <tr key={log.id}>
                    <td>{new Date(log.date).toLocaleString()}</td>
                    <td className="file-number-cell">
                      <a href={`/file/${log.fileId}`}>{log.fileNumber}</a>
                    </td>
                    <td>{log.subject}</td>
                    <td>
                      <span className={`action-badge ${log.action.toLowerCase().replace(/\s+/g, '-')}`}>
                        {log.action}
                      </span>
                    </td>
                    <td>{log.user}</td>
                    <td>{log.section}</td>
                    <td className="details-cell">{log.details}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="empty-state">
                    No logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Reports
