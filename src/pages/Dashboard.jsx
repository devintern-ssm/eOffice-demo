import React from 'react'
import { Link } from 'react-router-dom'
import { FiFile, FiInbox, FiCheckCircle, FiClock, FiPlus } from 'react-icons/fi'
import { files, currentUser } from '../data/dummyData'
import './Dashboard.css'

const Dashboard = () => {
  const pendingMyAction = files.filter(f => f.currentAssignee === currentUser.id).length
  const filesICreated = files.filter(f => f.createdBy === currentUser.id).length
  const awaitingApproval = files.filter(f => f.status === 'Under Review').length
  const overdueFiles = files.filter(f => {
    const daysSince = Math.floor((new Date() - new Date(f.lastModified)) / (1000 * 60 * 60 * 24))
    return daysSince > 7 && f.status !== 'Closed'
  }).length

  const recentActivity = files
    .flatMap(file => 
      file.movements.map(mov => ({
        ...mov,
        fileId: file.id,
        fileNumber: file.fileNumber,
        subject: file.subject
      }))
    )
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10)

  const stats = [
    {
      label: 'Pending My Action',
      value: pendingMyAction,
      icon: FiInbox,
      color: '#667eea',
      link: '/inbox'
    },
    {
      label: 'Files I Created',
      value: filesICreated,
      icon: FiFile,
      color: '#48bb78',
      link: '/my-files'
    },
    {
      label: 'Awaiting Approval',
      value: awaitingApproval,
      icon: FiCheckCircle,
      color: '#ed8936',
      link: '/pending-approvals'
    },
    {
      label: 'Overdue Files',
      value: overdueFiles,
      icon: FiClock,
      color: '#f56565',
      link: '/all-files?filter=overdue'
    }
  ]

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <Link to="/create-file" className="btn-primary">
          <FiPlus /> Create New File
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        {stats.map((stat, index) => {
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

      {/* Recent Activity */}
      <div className="dashboard-section">
        <h2>Recent Activity</h2>
        <div className="activity-list">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">
                  <FiFile />
                </div>
                <div className="activity-content">
                  <div className="activity-title">
                    <Link to={`/file/${activity.fileId}`} className="file-link">
                      {activity.fileNumber}
                    </Link>
                    <span className="activity-action">{activity.action}</span>
                  </div>
                  <div className="activity-subject">{activity.subject}</div>
                  <div className="activity-meta">
                    From: {activity.from.name} → To: {activity.to.name}
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
