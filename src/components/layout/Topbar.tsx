import { Bell, Loader2, Menu, Moon, Sun } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markNotificationRead,
} from '../../api/notifications'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { cn } from '../../lib/cn'
import type { NotificationItem } from '../../types/notifications'

interface TopbarProps {
  title: string
  onMenuClick: () => void
}

export function Topbar({ title, onMenuClick }: TopbarProps) {
  const { user } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const notificationRef = useRef<HTMLDivElement>(null)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [notificationLoading, setNotificationLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const initials = user
    ? (user.first_name?.[0] ?? '') + (user.last_name?.[0] ?? user.username[0] ?? 'U')
    : 'U'

  const loadNotificationCount = useCallback(async () => {
    try {
      setUnreadCount(await fetchUnreadNotificationCount())
    } catch {
      // The bell should never disrupt the rest of the workspace.
    }
  }, [])

  const loadNotifications = useCallback(async () => {
    setNotificationLoading(true)
    try {
      const response = await fetchNotifications({ page_size: 5 })
      setNotifications(response.results)
      await loadNotificationCount()
    } finally {
      setNotificationLoading(false)
    }
  }, [loadNotificationCount])

  useEffect(() => {
    loadNotificationCount()
    const timer = window.setInterval(loadNotificationCount, 30_000)
    return () => window.clearInterval(timer)
  }, [loadNotificationCount])

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setNotificationOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const toggleNotifications = () => {
    const next = !notificationOpen
    setNotificationOpen(next)
    if (next) loadNotifications()
  }

  const openNotification = async (notification: NotificationItem) => {
    if (!notification.is_read) {
      await markNotificationRead(notification.id)
      setUnreadCount((count) => Math.max(0, count - 1))
    }
    setNotificationOpen(false)
    navigate(notification.deep_link || '/notifications')
  }

  return (
    <header className="glass sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 px-4 sm:h-16 sm:px-6 dark:border-slate-800">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="hidden truncate text-xs text-slate-400 sm:block dark:text-slate-500">
            Home / {title}
          </p>
          <h1 className="truncate text-base font-semibold text-slate-900 sm:text-lg dark:text-white">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            onClick={toggleNotifications}
            className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
            aria-expanded={notificationOpen}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {notificationOpen && (
            <div className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Notifications
                  </p>
                  <p className="text-xs text-slate-500">{unreadCount} unread</p>
                </div>
                <button
                  type="button"
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
                  onClick={() => {
                    setNotificationOpen(false)
                    navigate('/notifications')
                  }}
                >
                  View all
                </button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notificationLoading ? (
                  <div className="flex h-32 items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                  </div>
                ) : notifications.length === 0 ? (
                  <p className="px-4 py-10 text-center text-sm text-slate-500">
                    You are up to date.
                  </p>
                ) : (
                  notifications.map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => openNotification(notification)}
                      className={cn(
                        'flex w-full gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800',
                        !notification.is_read &&
                          'bg-emerald-50/50 dark:bg-emerald-950/20',
                      )}
                    >
                      <span
                        className={cn(
                          'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                          notification.is_read && 'bg-slate-300',
                          !notification.is_read &&
                            notification.severity === 'critical' &&
                            'bg-red-500',
                          !notification.is_read &&
                            notification.severity === 'warning' &&
                            'bg-amber-500',
                          !notification.is_read &&
                            notification.severity === 'success' &&
                            'bg-emerald-500',
                          !notification.is_read &&
                            notification.severity === 'info' &&
                            'bg-blue-500',
                        )}
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                          {notification.title}
                        </span>
                        <span className="mt-0.5 block line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                          {notification.message}
                        </span>
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          className={cn(
            'rounded-lg p-2 transition-colors',
            'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800',
          )}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
        </button>
        <div className="ml-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-xs font-semibold text-white shadow-sm sm:ml-1 sm:h-9 sm:w-9">
          {initials.toUpperCase()}
        </div>
      </div>
    </header>
  )
}
