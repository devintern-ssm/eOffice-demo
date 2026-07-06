import { apiFetch } from './client'

/** My recent notifications + unread count. */
export function getNotifications() {
  return apiFetch('/notifications')
}

export function markAllNotificationsRead() {
  return apiFetch('/notifications/read', { method: 'POST' })
}

export function markNotificationRead(id) {
  return apiFetch(`/notifications/${id}/read`, { method: 'POST' })
}
