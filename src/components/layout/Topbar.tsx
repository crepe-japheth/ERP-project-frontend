import { Bell, Menu, Moon, Search, Sun } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { cn } from '../../lib/cn'

interface TopbarProps {
  title: string
  onMenuClick: () => void
}

export function Topbar({ title, onMenuClick }: TopbarProps) {
  const { user } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const initials = user
    ? (user.first_name?.[0] ?? '') + (user.last_name?.[0] ?? user.username[0] ?? 'U')
    : 'U'

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
        <button
          type="button"
          className="hidden rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 sm:block dark:hover:bg-slate-800"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
        </button>
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
