import { Loader2 } from 'lucide-react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { InventoryRoutes } from './pages/inventory'
import { ReportsPage } from './pages/inventory/ReportsPage'
import { LoginPage } from './pages/LoginPage'
import { HRRoutes } from './pages/hr'
import { HRSettingsPage } from './pages/hr/HRSettingsPage'
import { AccessControlPage } from './pages/AccessControlPage'
import { MyWorkspacePage } from './pages/MyWorkspacePage'
import { NotificationsPage } from './pages/NotificationsPage'
import { PlaceholderPage } from './pages/PlaceholderPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PermissionRoute({
  children,
  permissions,
  requireAll = false,
}: {
  children: React.ReactNode
  permissions: string[]
  requireAll?: boolean
}) {
  const { user, hasPermission } = useAuth()
  const allowed =
    user?.is_superuser ||
    (requireAll
      ? permissions.every(hasPermission)
      : permissions.some(hasPermission))
  if (!allowed) return <Navigate to={user?.employee_id ? '/my' : '/'} replace />
  return <>{children}</>
}

function HomeRoute() {
  const { user, hasPermission } = useAuth()
  if (
    hasPermission('core.users.read') &&
    hasPermission('core.roles.read')
  ) {
    return <Navigate to="/access-control" replace />
  }
  const inventoryPermissions = [
    'inventory.products.read',
    'inventory.categories.read',
    'inventory.suppliers.read',
    'inventory.purchases.read',
    'inventory.stock.read',
  ]
  if (inventoryPermissions.some(hasPermission)) {
    return <Navigate to="/inventory/dashboard" replace />
  }
  const hrPermissions = [
    'hr.employees.read',
    'hr.departments.read',
    'hr.contracts.read',
    'hr.attendance.read',
    'hr.leave.read',
    'hr.payroll.read',
  ]
  if (hrPermissions.some(hasPermission)) {
    return <Navigate to="/hr/dashboard" replace />
  }
  const destinations = [
    ['core.settings.read', '/settings'],
  ] as const
  const destination = destinations.find(([permission]) =>
    hasPermission(permission),
  )
  if (destination) return <Navigate to={destination[1]} replace />
  if (user?.employee_id) return <Navigate to="/my" replace />
  return <PlaceholderPage title="No access has been assigned to this account." />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomeRoute />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory/*"
        element={
          <ProtectedRoute>
            <PermissionRoute
              permissions={[
                'inventory.products.read',
                'inventory.categories.read',
                'inventory.suppliers.read',
                'inventory.purchases.read',
                'inventory.stock.read',
              ]}
            >
              <InventoryRoutes />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr/*"
        element={
          <ProtectedRoute>
            <PermissionRoute
              permissions={[
                'hr.employees.read',
                'hr.departments.read',
                'hr.contracts.read',
                'hr.attendance.read',
                'hr.leave.read',
                'hr.payroll.read',
              ]}
            >
              <HRRoutes />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <PermissionRoute permissions={['inventory.stock.read']}>
              <ReportsPage />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/my"
        element={
          <ProtectedRoute>
            <MyWorkspacePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/access-control"
        element={
          <ProtectedRoute>
            <PermissionRoute
              permissions={['core.users.read', 'core.roles.read']}
              requireAll
            >
              <AccessControlPage />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <PermissionRoute permissions={['core.settings.read']}>
              <HRSettingsPage />
            </PermissionRoute>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
