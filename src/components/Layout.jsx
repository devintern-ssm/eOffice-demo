import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  FiHome, 
  FiFile, 
  FiInbox, 
  FiCheckCircle, 
  FiSend,
  FiSearch,
  FiBell,
  FiUser,
  FiMenu,
  FiX,
  FiBarChart2
} from 'react-icons/fi'
import { currentUser } from '../data/dummyData'
import './Layout.css'

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()

  const menuItems = [
    { path: '/', icon: FiHome, label: 'Dashboard' },
    { path: '/my-files', icon: FiFile, label: 'My Files' },
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
          <div className="search-bar">
            <FiSearch className="search-icon" />
            <input type="text" placeholder="Search files, notes, correspondence..." />
          </div>
        </div>
        <div className="header-right">
          <button className="icon-button">
            <FiBell />
            <span className="badge">3</span>
          </button>
          <div className="user-profile">
            <FiUser className="user-icon" />
            <div className="user-info">
              <span className="user-name">{currentUser.name}</span>
              <span className="user-designation">{currentUser.designation}</span>
            </div>
          </div>
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
