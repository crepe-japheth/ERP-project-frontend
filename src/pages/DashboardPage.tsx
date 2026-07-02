import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Package,
  Plus,
  ShoppingCart,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { KpiCard } from '../components/ui/KpiCard'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { cn } from '../lib/cn'

const headcountData = [
  { month: 'Feb', count: 12 },
  { month: 'Mar', count: 14 },
  { month: 'Apr', count: 15 },
  { month: 'May', count: 16 },
  { month: 'Jun', count: 17 },
  { month: 'Jul', count: 18 },
  { month: 'Aug', count: 18 },
  { month: 'Sep', count: 19 },
  { month: 'Oct', count: 19 },
  { month: 'Nov', count: 20 },
  { month: 'Dec', count: 20 },
  { month: 'Jan', count: 20 },
]

const departmentData = [
  { name: 'Engineering', value: 5, color: '#3b82f6' },
  { name: 'Operations', value: 4, color: '#10b981' },
  { name: 'Sales', value: 3, color: '#14b8a6' },
  { name: 'Finance', value: 2, color: '#06b6d4' },
  { name: 'HR', value: 2, color: '#ef4444' },
  { name: 'Warehouse', value: 4, color: '#f97316' },
]

const recentActivity = [
  { action: 'Purchase order #PO-1042 approved', time: '2 min ago', type: 'inventory' },
  { action: 'Leave request from John M. pending', time: '15 min ago', type: 'hr' },
  { action: 'Stock alert: Cement below minimum', time: '1 hr ago', type: 'alert' },
  { action: 'Payroll for January generated', time: '3 hrs ago', type: 'payroll' },
  { action: 'New employee onboarded — Sarah K.', time: 'Yesterday', type: 'hr' },
]

const activityColors: Record<string, string> = {
  alert: 'bg-red-500',
  inventory: 'bg-blue-500',
  payroll: 'bg-purple-500',
  hr: 'bg-emerald-500',
}

export function DashboardPage() {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const firstName = user?.first_name || user?.username || 'there'

  const tickColor = isDark ? '#64748b' : '#94a3b8'
  const tooltipStyle = {
    borderRadius: '10px',
    border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    color: isDark ? '#e2e8f0' : '#334155',
    fontSize: '13px',
    boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)',
  }

  return (
    <DashboardLayout title="Dashboard">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">
            Dashboard
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Welcome back, {firstName}. Here&apos;s what&apos;s happening today.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => navigate('/inventory/products')}>
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
          <Button variant="secondary" size="sm">
            New Purchase
          </Button>
          <Button variant="secondary" size="sm" className="hidden sm:inline-flex">
            Approve Leave
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <KpiCard
          title="Total Employees"
          value={20}
          change="+11.1%"
          trend="up"
          icon={Users}
          iconBg={isDark ? '#064e3b' : '#ecfdf5'}
          iconColor="#059669"
        />
        <KpiCard
          title="Products"
          value={156}
          change="+8.2%"
          trend="up"
          icon={Package}
          iconBg={isDark ? '#1e3a5f' : '#eff6ff'}
          iconColor="#3b82f6"
        />
        <KpiCard
          title="Open Purchases"
          value={3}
          change="+25%"
          trend="up"
          icon={ShoppingCart}
          iconBg={isDark ? '#451a03' : '#fef3c7'}
          iconColor="#d97706"
        />
        <KpiCard
          title="Stock Value"
          value="RWF 4.2M"
          change="+2.3%"
          trend="up"
          icon={TrendingUp}
          iconBg={isDark ? '#14532d' : '#f0fdf4'}
          iconColor="#16a34a"
        />
        <KpiCard
          title="Low Stock Items"
          value={5}
          change="-15%"
          trend="down"
          icon={AlertTriangle}
          iconBg={isDark ? '#450a0a' : '#fef2f2'}
          iconColor="#ef4444"
        />
        <KpiCard
          title="Payroll (Month)"
          value="RWF 12.8M"
          change="+8%"
          trend="up"
          icon={Wallet}
          iconBg={isDark ? '#3b0764' : '#f5f3ff'}
          iconColor="#7c3aed"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card padding="lg">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-white">Headcount Trend</h3>
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="h-3.5 w-3.5" />
              +11.1%
            </span>
          </div>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            Employee growth over the last 12 months
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={headcountData}>
              <defs>
                <linearGradient id="headcountGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={isDark ? 0.4 : 0.3} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: tickColor }}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: tickColor }}
                width={28}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#059669"
                strokeWidth={2}
                fill="url(#headcountGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card padding="lg">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Department Distribution
            </h3>
            <span className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              <ArrowDownRight className="h-3.5 w-3.5" />
              20 total
            </span>
          </div>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            Employees by department
          </p>
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <ResponsiveContainer width="100%" height={200} className="max-w-[200px]">
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {departmentData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full flex-1 space-y-2">
              {departmentData.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="text-slate-600 dark:text-slate-400">{d.name}</span>
                  </div>
                  <span className="font-medium text-slate-900 dark:text-white">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <Card padding="lg" className="mt-6">
        <h3 className="font-semibold text-slate-900 dark:text-white">Recent Activity</h3>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Latest updates across modules
        </p>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {recentActivity.map((item) => (
            <div
              key={item.action}
              className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'h-2 w-2 shrink-0 rounded-full',
                    activityColors[item.type] ?? 'bg-slate-400',
                  )}
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">{item.action}</span>
              </div>
              <span className="pl-5 text-xs text-slate-400 sm:pl-0 dark:text-slate-500">
                {item.time}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </DashboardLayout>
  )
}
