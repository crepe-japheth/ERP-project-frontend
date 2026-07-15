export type NotificationSeverity = 'info' | 'success' | 'warning' | 'critical'

export interface NotificationItem {
  id: string
  module: string
  event_type: string
  title: string
  message: string
  severity: NotificationSeverity
  entity_type: string
  entity_id: string
  deep_link: string
  data: Record<string, unknown>
  is_read: boolean
  read_at: string | null
  created_at: string
}

export interface NotificationPage {
  count: number
  next: string | null
  previous: string | null
  results: NotificationItem[]
}
