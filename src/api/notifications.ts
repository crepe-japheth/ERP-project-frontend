import type {
  NotificationItem,
  NotificationPage,
  NotificationPreference,
} from '../types/notifications'
import { apiClient } from './client'

const BASE = '/notifications'

export async function fetchNotifications(params?: {
  page?: number
  page_size?: number
  module?: string
  severity?: string
  unread?: boolean
  search?: string
}) {
  const { data } = await apiClient.get<NotificationPage>(`${BASE}/`, { params })
  return data
}

export async function fetchUnreadNotificationCount() {
  const { data } = await apiClient.get<{ unread_count: number }>(
    `${BASE}/unread-count/`,
  )
  return data.unread_count
}

export async function markNotificationRead(id: string) {
  const { data } = await apiClient.post<NotificationItem>(`${BASE}/${id}/read/`)
  return data
}

export async function markAllNotificationsRead() {
  const { data } = await apiClient.post<{ updated: number }>(`${BASE}/read-all/`)
  return data.updated
}

export async function archiveNotification(id: string) {
  await apiClient.delete(`${BASE}/${id}/`)
}

export async function fetchNotificationPreferences() {
  const { data } = await apiClient.get<NotificationPreference>(
    `${BASE}/preferences/`,
  )
  return data
}

export async function updateNotificationPreferences(
  payload: Partial<NotificationPreference>,
) {
  const { data } = await apiClient.patch<NotificationPreference>(
    `${BASE}/preferences/`,
    payload,
  )
  return data
}

export async function createNotificationWebSocketToken() {
  const { data } = await apiClient.post<{ token: string; expires_in: number }>(
    `${BASE}/ws-token/`,
  )
  return data.token
}
