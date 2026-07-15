import {
  AlertTriangle,
  Package,
  ShoppingCart,
  TrendingUp,
  Truck,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { fetchInventoryDashboard } from '../../api/inventory'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { KpiCard } from '../../components/ui/KpiCard'
import { PageHeader } from '../../components/ui/PageHeader'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import type { InventoryDashboard } from '../../types/inventory'

const emptyDashboard: InventoryDashboard = {
  product_count: 0,
  supplier_count: 0,
  open_purchase_count: 0,
  stock_value: '0',
  stock_alert_count: 0,
  low_stock_count: 0,
  recent_purchases: [],
  valuation_by_category: [],
}

function money(value: string | number) {
  return Number(value).toLocaleString('en-RW', {
    style: 'currency',
    currency: 'RWF',
    maximumFractionDigits: 0,
  })
}

export function InventoryDashboardPage() {
  const { hasPermission } = useAuth()
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const [dashboard, setDashboard] =
    useState<InventoryDashboard>(emptyDashboard)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInventoryDashboard()
      .then(setDashboard)
      .finally(() => setLoading(false))
  }, [])

  const canProducts = hasPermission('inventory.products.read')
  const canSuppliers = hasPermission('inventory.suppliers.read')
  const canPurchases = hasPermission('inventory.purchases.read')
  const canStock = hasPermission('inventory.stock.read')
  const categoryChartData = dashboard.valuation_by_category.map((item) => ({
    ...item,
    value: Number(item.total_value),
  }))

  return (
    <DashboardLayout title="Inventory Dashboard">
      <PageHeader
        title="Inventory Dashboard"
        description="Stock levels, purchasing activity, suppliers, and inventory value."
      >
        {hasPermission('inventory.products.create') && (
          <Button size="sm" onClick={() => navigate('/inventory/products')}>
            Add Product
          </Button>
        )}
        {hasPermission('inventory.purchases.create') && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate('/inventory/purchases')}
          >
            New Purchase
          </Button>
        )}
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {canProducts && (
          <KpiCard
            title="Active Products"
            value={loading ? '—' : dashboard.product_count}
            change="Product catalogue"
            trend="neutral"
            icon={Package}
            iconBg={isDark ? '#1e3a5f' : '#eff6ff'}
            iconColor="#3b82f6"
          />
        )}
        {canSuppliers && (
          <KpiCard
            title="Active Suppliers"
            value={loading ? '—' : dashboard.supplier_count}
            change="Approved vendors"
            trend="neutral"
            icon={Truck}
            iconBg={isDark ? '#134e4a' : '#f0fdfa'}
            iconColor="#0d9488"
          />
        )}
        {canPurchases && (
          <KpiCard
            title="Open Purchases"
            value={loading ? '—' : dashboard.open_purchase_count}
            change="Awaiting completion"
            trend={dashboard.open_purchase_count ? 'up' : 'neutral'}
            icon={ShoppingCart}
            iconBg={isDark ? '#451a03' : '#fffbeb'}
            iconColor="#d97706"
          />
        )}
        {canStock && (
          <>
            <KpiCard
              title="Stock Value"
              value={loading ? '—' : money(dashboard.stock_value)}
              change="Current valuation"
              trend="neutral"
              icon={TrendingUp}
              iconBg={isDark ? '#14532d' : '#f0fdf4'}
              iconColor="#16a34a"
            />
            <KpiCard
              title="Stock Alerts"
              value={loading ? '—' : dashboard.stock_alert_count}
              change={`${dashboard.low_stock_count} low or out`}
              trend={dashboard.stock_alert_count ? 'down' : 'up'}
              icon={AlertTriangle}
              iconBg={isDark ? '#450a0a' : '#fef2f2'}
              iconColor="#ef4444"
            />
          </>
        )}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        {canStock && (
          <Card padding="lg">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Inventory Value by Category
            </h3>
            <p className="mb-5 text-sm text-slate-500">
              Current stock valuation grouped by product category.
            </p>
            <div>
              {categoryChartData.length ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={categoryChartData}
                    layout="vertical"
                    margin={{ left: 8, right: 18 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis
                      type="number"
                      tickFormatter={(value) =>
                        `${Math.round(Number(value) / 1000)}K`
                      }
                    />
                    <YAxis
                      type="category"
                      dataKey="category"
                      width={100}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value) => [money(Number(value)), 'Value']}
                    />
                    <Bar
                      dataKey="value"
                      fill="#10b981"
                      radius={[0, 6, 6, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-slate-500">No stock valuation yet.</p>
              )}
            </div>
          </Card>
        )}

        {canPurchases && (
          <Card padding="lg">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Recent Purchases
                </h3>
                <p className="text-sm text-slate-500">
                  Latest purchase orders and their status.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/inventory/purchases')}
              >
                View all
              </Button>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {dashboard.recent_purchases.length ? (
                dashboard.recent_purchases.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {purchase.purchase_number}
                      </p>
                      <p className="text-xs text-slate-500">
                        {purchase.supplier_name} · {purchase.purchase_date}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {money(purchase.total_amount)}
                      </p>
                      <p className="text-xs capitalize text-slate-500">
                        {purchase.status.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No purchases yet.</p>
              )}
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
