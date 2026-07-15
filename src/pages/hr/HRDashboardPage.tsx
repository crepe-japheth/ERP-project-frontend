import {
  Cake,
  CalendarCheck,
  ClipboardList,
  FileSignature,
  Users,
  Wallet,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { fetchHRSummary } from '../../api/hr'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { KpiCard } from '../../components/ui/KpiCard'
import { PageHeader } from '../../components/ui/PageHeader'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import type { HRSummary } from '../../types/hr'

const emptySummary: HRSummary = {
  total_employees: 0,
  departments: 0,
  pending_leave: 0,
  open_payroll_periods: 0,
  today_present: 0,
  paid_this_month: '0',
  active_contracts: 0,
  upcoming_birthdays: [],
  department_distribution: [],
}

const chartColors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4']

function money(value: string | number) {
  return Number(value).toLocaleString('en-RW', {
    style: 'currency',
    currency: 'RWF',
    maximumFractionDigits: 0,
  })
}

export function HRDashboardPage() {
  const { hasPermission } = useAuth()
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const [summary, setSummary] = useState<HRSummary>(emptySummary)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHRSummary()
      .then(setSummary)
      .finally(() => setLoading(false))
  }, [])

  const canEmployees = hasPermission('hr.employees.read')
  const canAttendance = hasPermission('hr.attendance.read')
  const canLeave = hasPermission('hr.leave.read')
  const canContracts = hasPermission('hr.contracts.read')
  const canPayroll = hasPermission('hr.payroll.read')

  return (
    <DashboardLayout title="HR Dashboard">
      <PageHeader
        title="HR Dashboard"
        description="People, attendance, leave, contracts, and payroll at a glance."
      >
        {hasPermission('hr.employees.create') && (
          <Button size="sm" onClick={() => navigate('/hr/employees')}>
            Add Employee
          </Button>
        )}
        {hasPermission('hr.leave.approve') && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate('/hr/leave')}
          >
            Review Leave
          </Button>
        )}
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {canEmployees && (
          <KpiCard
            title="Active Employees"
            value={loading ? '—' : summary.total_employees}
            change={`${summary.departments} departments`}
            trend="neutral"
            icon={Users}
            iconBg={isDark ? '#064e3b' : '#ecfdf5'}
            iconColor="#059669"
          />
        )}
        {canAttendance && (
          <KpiCard
            title="Present Today"
            value={loading ? '—' : summary.today_present}
            change="Attendance recorded"
            trend="up"
            icon={CalendarCheck}
            iconBg={isDark ? '#1e3a5f' : '#eff6ff'}
            iconColor="#3b82f6"
          />
        )}
        {canLeave && (
          <KpiCard
            title="Pending Leave"
            value={loading ? '—' : summary.pending_leave}
            change="Awaiting review"
            trend={summary.pending_leave ? 'down' : 'up'}
            icon={ClipboardList}
            iconBg={isDark ? '#451a03' : '#fffbeb'}
            iconColor="#d97706"
          />
        )}
        {canContracts && (
          <KpiCard
            title="Active Contracts"
            value={loading ? '—' : summary.active_contracts}
            change="Currently effective"
            trend="neutral"
            icon={FileSignature}
            iconBg={isDark ? '#3b0764' : '#f5f3ff'}
            iconColor="#7c3aed"
          />
        )}
        {canPayroll && (
          <>
            <KpiCard
              title="Open Payrolls"
              value={loading ? '—' : summary.open_payroll_periods}
              change="Not yet paid"
              trend="neutral"
              icon={Wallet}
              iconBg={isDark ? '#3b0764' : '#f5f3ff'}
              iconColor="#8b5cf6"
            />
            <KpiCard
              title="Paid This Month"
              value={loading ? '—' : money(summary.paid_this_month)}
              change="Confirmed payments"
              trend="up"
              icon={Wallet}
              iconBg={isDark ? '#14532d' : '#f0fdf4'}
              iconColor="#16a34a"
            />
          </>
        )}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        {canEmployees && (
          <Card padding="lg">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                  <Cake className="h-5 w-5 text-pink-500" />
                  Upcoming Birthdays
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Employee birthdays in the next 30 days.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/hr/employees')}
              >
                Employees
              </Button>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {summary.upcoming_birthdays.length ? (
                summary.upcoming_birthdays.map((birthday) => (
                  <div
                    key={birthday.employee_id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-50 font-semibold text-pink-600 dark:bg-pink-950/40">
                        {birthday.full_name
                          .split(' ')
                          .map((part) => part[0])
                          .join('')
                          .slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {birthday.full_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {birthday.department || birthday.employee_number}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {new Date(
                          `${birthday.next_birthday}T00:00:00`,
                        ).toLocaleDateString('en-RW', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-xs text-pink-600">
                        {birthday.days_until === 0
                          ? 'Today'
                          : `In ${birthday.days_until} day${
                              birthday.days_until === 1 ? '' : 's'
                            }`}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  No birthdays in the next 30 days.
                </p>
              )}
            </div>
          </Card>
        )}

        {canEmployees && (
          <Card padding="lg">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Employees by Department
            </h3>
            <p className="mb-4 text-sm text-slate-500">
              Current active employee distribution.
            </p>
            {summary.department_distribution.length ? (
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <ResponsiveContainer width="100%" height={230}>
                  <PieChart>
                    <Pie
                      data={summary.department_distribution}
                      dataKey="employee_count"
                      nameKey="department"
                      innerRadius={55}
                      outerRadius={88}
                      paddingAngle={3}
                    >
                      {summary.department_distribution.map((item, index) => (
                        <Cell
                          key={item.department}
                          fill={chartColors[index % chartColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-full space-y-2">
                  {summary.department_distribution.map((item, index) => (
                    <div
                      key={item.department}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor:
                              chartColors[index % chartColors.length],
                          }}
                        />
                        {item.department}
                      </span>
                      <strong>{item.employee_count}</strong>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                No department distribution available.
              </p>
            )}
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
