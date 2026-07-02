import {
  AlertTriangle,
  CalendarClock,
  Package,
  PackageX,
  RotateCcw,
  Timer,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { fetchAlerts } from '../../api/inventory'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { Select } from '../../components/ui/Select'
import type { AlertSummary, StockAlert } from '../../types/inventory'
import { cn } from '../../lib/cn'

const ALERT_TYPES = [
  { value: '', label: 'All alerts' },
  { value: 'out_of_stock', label: 'Out of Stock' },
  { value: 'minimum_stock', label: 'Minimum Stock' },
  { value: 'expired', label: 'Expired Items' },
  { value: 'near_expiry', label: 'Near Expiry' },
  { value: 'pending_return', label: 'Pending Returns' },
  { value: 'overdue_return', label: 'Overdue Returns' },
]

const TYPE_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  out_of_stock: { label: 'Out of Stock', icon: PackageX, color: 'text-red-600' },
  minimum_stock: { label: 'Low Stock', icon: AlertTriangle, color: 'text-amber-600' },
  expired: { label: 'Expired', icon: CalendarClock, color: 'text-red-600' },
  near_expiry: { label: 'Near Expiry', icon: Timer, color: 'text-amber-600' },
  pending_return: { label: 'Pending Return', icon: RotateCcw, color: 'text-blue-600' },
  overdue_return: { label: 'Overdue Return', icon: RotateCcw, color: 'text-red-600' },
}

function severityBadge(severity: string) {
  if (severity === 'critical') return 'danger' as const
  if (severity === 'warning') return 'warning' as const
  return 'info' as const
}

export function AlertsPage() {
  const [summary, setSummary] = useState<AlertSummary | null>(null)
  const [alerts, setAlerts] = useState<StockAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchAlerts(typeFilter || undefined)
      setSummary(data.summary)
      setAlerts(data.alerts)
    } finally {
      setLoading(false)
    }
  }, [typeFilter])

  useEffect(() => {
    load()
  }, [load])

  const summaryCards = [
    { key: 'out_of_stock', count: summary?.counts.out_of_stock ?? 0 },
    { key: 'minimum_stock', count: summary?.counts.minimum_stock ?? 0 },
    { key: 'near_expiry', count: summary?.counts.near_expiry ?? 0 },
    { key: 'overdue_return', count: summary?.counts.overdue_return ?? 0 },
  ]

  return (
    <DashboardLayout title="Stock Alerts">
      <PageHeader
        title="Stock Alerts"
        description="Automatic alerts for low stock, expiry, and overdue returns."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {summaryCards.map(({ key, count }) => {
          const meta = TYPE_META[key]
          const Icon = meta?.icon ?? Package
          return (
            <Card key={key} padding="sm" className="flex items-center gap-3">
              <div className={cn('rounded-lg bg-slate-100 p-2 dark:bg-slate-800', meta?.color)}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{count}</p>
                <p className="text-xs text-slate-500">{meta?.label}</p>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="mb-4 max-w-xs">
        <Select
          options={ALERT_TYPES}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading alerts...</div>
      ) : alerts.length === 0 ? (
        <Card padding="lg" className="text-center">
          <Package className="mx-auto h-10 w-10 text-emerald-500" />
          <p className="mt-3 font-medium text-slate-900 dark:text-white">All clear</p>
          <p className="text-sm text-slate-500">No active stock alerts right now.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const meta = TYPE_META[alert.type]
            const Icon = meta?.icon ?? AlertTriangle
            return (
              <Card
                key={`${alert.type}-${alert.reference_id}`}
                padding="md"
                hover
                className="flex items-start gap-4"
              >
                <div className={cn('mt-0.5 rounded-lg bg-slate-100 p-2 dark:bg-slate-800', meta?.color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-900 dark:text-white">{alert.title}</p>
                    <Badge variant={severityBadge(alert.severity)}>{meta?.label ?? alert.type}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{alert.message}</p>
                  {alert.product_code && (
                    <p className="mt-1 font-mono text-xs text-slate-400">{alert.product_code}</p>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </DashboardLayout>
  )
}
