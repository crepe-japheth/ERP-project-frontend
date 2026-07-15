import {
  BarChart3,
  Bell,
  Boxes,
  Building2,
  Calendar,
  ChevronLeft,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Package,
  PackageMinus,
  Search,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  UserCircle,
  UserCog,
  Wallet,
  X,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { cn } from '../../lib/cn'

interface NavItem {
  label: string
  to: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  permissions?: string[]
  requireAll?: boolean
  personal?: boolean
  management?: boolean
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    title: 'Main',
    items: [
      { label: 'Dashboard', to: '/', icon: LayoutDashboard, management: true },
      {
        label: 'My Workspace',
        to: '/my',
        icon: UserCircle,
        personal: true,
      },
      {
        label: 'Notifications',
        to: '/inventory/alerts',
        icon: Bell,
        permissions: ['inventory.stock.read'],
      },
      { label: 'Search', to: '/search', icon: Search, management: true },
      { label: 'Calendar', to: '/calendar', icon: Calendar, management: true },
    ],
  },
  {
    title: 'Inventory',
    items: [
      { label: 'Products', to: '/inventory/products', icon: Package, permissions: ['inventory.products.read'] },
      { label: 'Categories', to: '/inventory/categories', icon: Boxes, permissions: ['inventory.categories.read'] },
      { label: 'Suppliers', to: '/inventory/suppliers', icon: Truck, permissions: ['inventory.suppliers.read'] },
      { label: 'Purchases', to: '/inventory/purchases', icon: ShoppingCart, permissions: ['inventory.purchases.read'] },
      { label: 'Stock Issues', to: '/inventory/issues', icon: PackageMinus, permissions: ['inventory.stock.read'] },
      { label: 'Stock', to: '/inventory/stock', icon: ClipboardList, permissions: ['inventory.stock.read'] },
      { label: 'Alerts', to: '/inventory/alerts', icon: Bell, permissions: ['inventory.stock.read'] },
      { label: 'Reports', to: '/inventory/reports', icon: BarChart3, permissions: ['inventory.stock.read'] },
    ],
  },
  {
    title: 'Human Resources',
    items: [
      { label: 'Employees', to: '/hr/employees', icon: Users, permissions: ['hr.employees.read'] },
      { label: 'Departments', to: '/hr/departments', icon: Building2, permissions: ['hr.departments.read'] },
      { label: 'Contracts', to: '/hr/contracts', icon: ClipboardList, permissions: ['hr.contracts.read'] },
      { label: 'Allowances', to: '/hr/allowances', icon: Wallet, permissions: ['hr.payroll.read'] },
      { label: 'Deductions', to: '/hr/deductions', icon: PackageMinus, permissions: ['hr.payroll.read'] },
      { label: 'Attendance', to: '/hr/attendance', icon: Calendar, permissions: ['hr.attendance.read'] },
      { label: 'Leave', to: '/hr/leave', icon: ClipboardList, permissions: ['hr.leave.read'] },
      { label: 'Payroll', to: '/hr/payroll', icon: Wallet, permissions: ['hr.payroll.read'] },
      { label: 'Payslips', to: '/hr/payslips', icon: BarChart3, permissions: ['hr.payroll.read'] },
    ],
  },
  {
    title: 'System',
    items: [
      {
        label: 'User Access',
        to: '/access-control',
        icon: UserCog,
        permissions: ['core.users.read', 'core.roles.read'],
        requireAll: true,
      },
      { label: 'Settings', to: '/settings', icon: Settings, permissions: ['core.settings.read'] },
    ],
  },
]

interface SidebarProps {
  collapsed: boolean
  mobileOpen: boolean
  onToggle: () => void
  onMobileClose: () => void
}

export function Sidebar({ collapsed, mobileOpen, onToggle, onMobileClose }: SidebarProps) {
  const { user, logout, hasPermission } = useAuth()
  const displayName =
    user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.username ?? 'User'

  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const canSeeItem = (item: NavItem) => {
    if (item.personal) return Boolean(user?.employee_id)
    if (item.management) {
      return Boolean(user?.is_superuser || user?.permissions?.length)
    }
    if (!item.permissions?.length) return true
    return item.requireAll
      ? item.permissions.every(hasPermission)
      : item.permissions.some(hasPermission)
  }
  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(canSeeItem),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200 bg-white transition-all duration-300',
        'dark:border-slate-800 dark:bg-slate-900',
        collapsed ? 'lg:w-[72px]' : 'lg:w-64',
        'w-72',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4 dark:border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-sm font-bold text-white shadow-sm shadow-emerald-600/30">
            EP
          </div>
          {(!collapsed || mobileOpen) && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                ERP Suite
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {user?.employee_id && !user.permissions?.length && !user.is_superuser
                  ? 'Employee Portal'
                  : 'Management Workspace'}
              </p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onMobileClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {visibleGroups.map((group) => (
          <div key={group.title} className="mb-5">
            {(!collapsed || mobileOpen) && (
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {group.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    onClick={onMobileClose}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-600/5 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200',
                      )
                    }
                  >
                    <item.icon className="h-[18px] w-[18px] shrink-0" />
                    {(!collapsed || mobileOpen) && (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge != null && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-100 p-3 dark:border-slate-800">
        {(!collapsed || mobileOpen) && user && (
          <div className="mb-2 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/60">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                {displayName}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => logout()}
          className="mb-1 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          {(!collapsed || mobileOpen) && <span className="text-xs">Sign out</span>}
        </button>
        <button
          type="button"
          onClick={onToggle}
          className="hidden w-full items-center justify-center gap-2 rounded-lg py-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 lg:flex dark:hover:bg-slate-800 dark:hover:text-slate-300"
        >
          <ChevronLeft
            className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')}
          />
          {!collapsed && <span className="text-xs">Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
