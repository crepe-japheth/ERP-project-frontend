import { Archive, Bell, CheckCheck, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  archiveNotification,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/notifications'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { Select } from '../components/ui/Select'
import { cn } from '../lib/cn'
import type {
  NotificationItem,
  NotificationSeverity,
} from '../types/notifications'

const moduleOptions = [
  { value: '', label: 'All modules' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'hr', label: 'Human Resources' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'system', label: 'System' },
]

const statusOptions = [
  { value: '', label: 'All notifications' },
  { value: 'true', label: 'Unread only' },
]

const badgeVariant: Record<
  NotificationSeverity,
  'info' | 'success' | 'warning' | 'danger'
> = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  critical: 'danger',
}

export function NotificationsPage() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [count, setCount] = useState(0)
  const [module, setModule] = useState('')
  const [unread, setUnread] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetchNotifications({
        page,
        page_size: 20,
        module: module || undefined,
        unread: unread === 'true' || undefined,
      })
      setNotifications(response.results)
      setCount(response.count)
    } finally {
      setLoading(false)
    }
  }, [module, page, unread])

  useEffect(() => {
    load()
  }, [load])

  const openNotification = async (notification: NotificationItem) => {
    if (!notification.is_read) {
      await markNotificationRead(notification.id)
    }
    if (notification.deep_link) navigate(notification.deep_link)
    else load()
  }

  const markAllRead = async () => {
    await markAllNotificationsRead()
    await load()
  }

  const archive = async (notification: NotificationItem) => {
    await archiveNotification(notification.id)
    await load()
  }

  const totalPages = Math.max(1, Math.ceil(count / 20))

  return (
    <DashboardLayout title="Notifications">
      <PageHeader
        title="Notification Center"
        description="Operational updates from inventory, HR, payroll, and your account."
      >
        <Button variant="secondary" onClick={markAllRead}>
          <CheckCheck className="h-4 w-4" />
          Mark all as read
        </Button>
      </PageHeader>

      <Card padding="sm" className="mb-4 grid gap-3 sm:grid-cols-2">
        <Select
          aria-label="Filter by module"
          value={module}
          options={moduleOptions}
          onChange={(event) => {
            setModule(event.target.value)
            setPage(1)
          }}
        />
        <Select
          aria-label="Filter by read status"
          value={unread}
          options={statusOptions}
          onChange={(event) => {
            setUnread(event.target.value)
            setPage(1)
          }}
        />
      </Card>

      {loading ? (
        <Card className="flex min-h-56 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
        </Card>
      ) : notifications.length === 0 ? (
        <Card className="flex min-h-56 flex-col items-center justify-center text-center">
          <Bell className="h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="mt-3 font-medium text-slate-700 dark:text-slate-200">
            No notifications
          </p>
          <p className="mt-1 text-sm text-slate-500">
            You are up to date.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              padding="sm"
              className={cn(
                'flex cursor-pointer gap-3 transition-colors hover:border-emerald-300',
                !notification.is_read &&
                  'border-l-4 border-l-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/10',
              )}
              onClick={() => openNotification(notification)}
            >
              <span
                className={cn(
                  'mt-2 h-2.5 w-2.5 shrink-0 rounded-full',
                  notification.severity === 'critical' && 'bg-red-500',
                  notification.severity === 'warning' && 'bg-amber-500',
                  notification.severity === 'success' && 'bg-emerald-500',
                  notification.severity === 'info' && 'bg-blue-500',
                )}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {notification.title}
                  </h3>
                  <Badge variant={badgeVariant[notification.severity]}>
                    {notification.module}
                  </Badge>
                  {!notification.is_read && <Badge>New</Badge>}
                </div>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {notification.message}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  {new Date(notification.created_at).toLocaleString()}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Archive notification"
                onClick={(event) => {
                  event.stopPropagation()
                  archive(notification)
                }}
              >
                <Archive className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            disabled={page === 1}
            onClick={() => setPage((value) => value - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-slate-500">
            {page} / {totalPages}
          </span>
          <Button
            variant="secondary"
            disabled={page === totalPages}
            onClick={() => setPage((value) => value + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </DashboardLayout>
  )
}
