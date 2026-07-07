import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  FiHome,
  FiFile,
  FiInbox,
  FiCheckCircle,
  FiSend,
  FiUser,
  FiMenu,
  FiX,
  FiBarChart2,
  FiLogOut,
  FiEdit
} from 'react-icons/fi'
import { useAuth } from '../auth/AuthContext'
import NotificationBell from './NotificationBell'
import GlobalSearch from './GlobalSearch'
import './Layout.css'

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()
  const { user, logout } = useAuth()

  const isAdmin = user?.role === 'ADMIN'
  // The admin is an oversight (super-admin) role — no Noting/Correspondence worker views.
  const menuItems = isAdmin ? [
    { path: '/', icon: FiHome, label: 'Dashboard' },
    { path: '/all-files', icon: FiFile, label: 'All Files' },
    { path: '/reports', icon: FiBarChart2, label: 'Reports & Logs' },
  ] : [
    { path: '/', icon: FiHome, label: 'Dashboard' },
    { path: '/my-files', icon: FiFile, label: 'My Files' },
    { path: '/drafts', icon: FiEdit, label: 'Drafts' },
    { path: '/inbox', icon: FiInbox, label: 'Inbox' },
    { path: '/pending-approvals', icon: FiCheckCircle, label: 'Pending Approvals' },
    { path: '/sent-files', icon: FiSend, label: 'Sent Files' },
    { path: '/all-files', icon: FiFile, label: 'All Files' },
    { path: '/reports', icon: FiBarChart2, label: 'Reports & Logs' }
  ]

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="layout">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <button 
            className="menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <FiX /> : <FiMenu />}
          </button>
          <div className="logo">
            <FiFile className="logo-icon" />
            <span className="logo-text">eOffice</span>
          </div>
        </div>
        <div className="header-center">
          <GlobalSearch />
        </div>
        <div className="header-right">
          <NotificationBell />
          <div className="user-profile">
            <FiUser className="user-icon" />
            <div className="user-info">
              <span className="user-name">{user?.name}</span>
              <span className="user-designation">{user?.designation} · {user?.role}</span>
            </div>
          </div>
          <button className="icon-button" title="Log out" onClick={logout}>
            <FiLogOut />
          </button>
        </div>
      </header>

      <div className="layout-body">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <nav className="sidebar-nav">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                >
                  <Icon className="nav-icon" />
                  <span className="nav-label">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout
