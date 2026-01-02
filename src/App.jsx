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

function App() {
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
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
