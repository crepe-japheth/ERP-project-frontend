import { AlertCircle, Loader2, Lock, User } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { cn } from '../lib/cn'

export function LoginPage() {
  const { user, loading, login } = useAuth()
  const { isDark } = useTheme()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin12345')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(username, password)
    } catch {
      setError('Invalid username or password. Try admin / admin12345')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = cn(
    'w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none transition-all duration-200',
    'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400',
    'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20',
    'dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500',
    'dark:focus:border-emerald-500 dark:focus:ring-emerald-500/20',
  )

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 p-12 text-white lg:flex">
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl" />

        <div className="relative">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-lg font-bold backdrop-blur-sm">
            EP
          </div>
          <h1 className="mt-10 text-4xl font-bold leading-tight tracking-tight">
            Enterprise Resource
            <br />
            Planning Suite
          </h1>
          <p className="mt-4 max-w-md text-emerald-100/90">
            Manage inventory, human resources, payroll, and operations from one unified
            platform built for growing businesses.
          </p>
        </div>

        <div className="relative space-y-4">
          <div className="flex gap-3">
            {['Inventory', 'HR', 'Payroll', 'Reports'].map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-sm"
              >
                {tag}
              </span>
            ))}
          </div>
          <p className="text-sm text-emerald-200/80">
            Trusted by teams across Rwanda and East Africa
          </p>
        </div>
      </div>

      <div
        className={cn(
          'flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2',
          isDark ? 'bg-slate-950' : 'bg-slate-50',
        )}
      >
        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-8 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-sm font-bold text-white shadow-lg shadow-emerald-600/30">
              EP
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Sign in to your ERP admin account
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={inputClass}
                  placeholder="Enter username"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  placeholder="Enter password"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <Button type="submit" disabled={submitting} size="lg" className="w-full">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
            Default credentials: admin / admin12345
          </p>
        </div>
      </div>
    </div>
  )
}
