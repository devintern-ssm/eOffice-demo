import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import MyFiles from './pages/MyFiles'
import Inbox from './pages/Inbox'
import PendingApprovals from './pages/PendingApprovals'
import SentFiles from './pages/SentFiles'
import AllFiles from './pages/AllFiles'
import FileDetail from './pages/FileDetail'
import CreateFile from './pages/CreateFile'
import Reports from './pages/Reports'
import Login from './pages/Login'
import { AuthProvider, useAuth } from './auth/AuthContext'

function Shell() {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ padding: 40, color: '#718096' }}>Loading…</div>
  if (!user) return <Login />
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/my-files" element={<MyFiles />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/pending-approvals" element={<PendingApprovals />} />
          <Route path="/sent-files" element={<SentFiles />} />
          <Route path="/all-files" element={<AllFiles />} />
          <Route path="/file/:fileId" element={<FileDetail />} />
          <Route path="/create-file" element={<CreateFile />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </Layout>
    </Router>
  )
}

function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  )
}

export default App
