import { useEffect, useState, type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { cn } from '../../lib/cn'

interface DashboardLayoutProps {
  title: string
  children: ReactNode
}

export function DashboardLayout({ title, children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  return (
    <div className="min-h-screen bg-surface dark:bg-slate-950">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggle={() => setCollapsed((c) => !c)}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div
        className={cn(
          'min-h-screen transition-[padding] duration-300',
          'pl-0 lg:pl-64',
          collapsed && 'lg:pl-[72px]',
        )}
      >
        <Topbar
          title={title}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="animate-fade-in p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}
