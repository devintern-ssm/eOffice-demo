import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiBell, FiCheck } from 'react-icons/fi'
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../api/notifications'

const TYPE_COLOR = {
  FORWARD: '#4299e1', CHECK: '#4299e1', APPROVE: '#38a169', REVERT: '#e53e3e',
  ROUTE: '#805ad5', RETURN: '#dd6b20', ASSIGN: '#3182ce', COMMENT: '#718096',
}

const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

const NotificationBell = () => {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const load = () => getNotifications()
    .then((d) => { setItems(d.notifications || []); setUnread(d.unreadCount || 0) })
    .catch(() => {})

  useEffect(() => {
    load()
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const toggle = () => { const next = !open; setOpen(next); if (next) load() }

  const openItem = async (n) => {
    setOpen(false)
    if (!n.read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
      try { const d = await markNotificationRead(n.id); setUnread(d.unreadCount) } catch { /* ignore */ }
    }
    if (n.fileId) navigate(`/file/${n.fileId}`)
  }

  const markAll = async () => {
    setItems((prev) => prev.map((x) => ({ ...x, read: true })))
    setUnread(0)
    try { await markAllNotificationsRead() } catch { /* ignore */ }
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="icon-button" onClick={toggle} title="Notifications">
        <FiBell />
        {unread > 0 && <span className="badge">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 340, maxHeight: 440,
          background: '#fff', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          border: '1px solid #e2e8f0', zIndex: 1000, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #edf2f7' }}>
            <strong style={{ fontSize: 14, color: '#2d3748' }}>Notifications</strong>
            {unread > 0 && (
              <button onClick={markAll} style={{ border: 'none', background: 'transparent', color: '#4c51bf', cursor: 'pointer', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <FiCheck /> Mark all read
              </button>
            )}
          </div>
          <div style={{ overflowY: 'auto' }}>
            {items.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#a0aec0', fontSize: 13 }}>No notifications</div>
            ) : items.map((n) => (
              <div
                key={n.id}
                onClick={() => openItem(n)}
                style={{
                  display: 'flex', gap: 10, padding: '10px 14px', cursor: 'pointer',
                  borderBottom: '1px solid #f7fafc', background: n.read ? '#fff' : '#f0f5ff',
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', marginTop: 6, flexShrink: 0, background: TYPE_COLOR[n.type] || '#a0aec0' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: '#2d3748', lineHeight: 1.4 }}>{n.message}</div>
                  <div style={{ fontSize: 11, color: '#a0aec0', marginTop: 2 }}>{n.type} · {timeAgo(n.date)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
