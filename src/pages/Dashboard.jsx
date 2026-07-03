import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiFile, FiInbox, FiCheckCircle, FiSend, FiPlus } from 'react-icons/fi'
import { getStats } from '../api/files'
import { prettyStatus } from '../utils/status'
import './Dashboard.css'

const Dashboard = () => {
  const [stats, setStats] = useState({ inboxCount: 0, filesCreated: 0, pendingMyAction: 0, awaitingApproval: 0 })
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    getStats()
      .then((data) => {
        if (!active) return
        setStats(data.stats)
        setRecentActivity(data.recentActivity)
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const cards = [
    { label: 'In My Inbox', value: stats.inboxCount, icon: FiInbox, color: '#667eea', link: '/inbox' },
    { label: 'Files I Created', value: stats.filesCreated, icon: FiFile, color: '#48bb78', link: '/my-files' },
    { label: 'Pending My Approval', value: stats.pendingMyAction, icon: FiCheckCircle, color: '#ed8936', link: '/pending-approvals' },
    { label: 'Awaiting Approval', value: stats.awaitingApproval, icon: FiSend, color: '#805ad5', link: '/sent-files' },
  ]

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <Link to="/create-file" className="btn-primary">
          <FiPlus /> Create New File
        </Link>
      </div>

      <div className="stats-grid">
        {cards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Link key={index} to={stat.link} className="stat-card">
              <div className="stat-icon" style={{ background: `${stat.color}20`, color: stat.color }}>
                <Icon />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="dashboard-section">
        <h2>Recent Activity</h2>
        <div className="activity-list">
          {loading ? (
            <div className="empty-state">Loading…</div>
          ) : recentActivity.length > 0 ? (
            recentActivity.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">
                  <FiFile />
                </div>
                <div className="activity-content">
                  <div className="activity-title">
                    <Link to={`/file/${activity.fileId}`} className="file-link">
                      {activity.fileNumber}
                    </Link>
                    <span className="activity-action">{prettyStatus(activity.type)}</span>
                  </div>
                  <div className="activity-subject">{activity.fileSubject}</div>
                  <div className="activity-meta">
                    {activity.actorName}{activity.remarks ? ` — ${activity.remarks}` : ''}
                    <span className="activity-date">
                      {new Date(activity.date).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">No recent activity</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
