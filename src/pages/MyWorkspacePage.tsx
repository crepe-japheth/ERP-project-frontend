import { FileText, Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  cancelSelfLeaveRequest,
  createSelfLeaveRequest,
  fetchSelfAttendance,
  fetchSelfLeaveRequests,
  fetchSelfLeaveTypes,
  fetchSelfPayslip,
  fetchSelfPayslips,
  fetchSelfProfile,
} from '../api/hr'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { DataTable, TableCell, TableRow } from '../components/ui/DataTable'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { Select } from '../components/ui/Select'
import { cn } from '../lib/cn'
import type {
  Attendance,
  Employee,
  LeaveRequest,
  LeaveType,
  Payslip,
} from '../types/hr'

type Tab = 'profile' | 'attendance' | 'payslips' | 'leave'

function money(value: string | number) {
  return Number(value).toLocaleString('en-RW', {
    style: 'currency',
    currency: 'RWF',
    maximumFractionDigits: 0,
  })
}

function formatTime(value: string | null) {
  return value
    ? new Date(value).toLocaleTimeString('en-RW', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'
}

export function MyWorkspacePage() {
  const [tab, setTab] = useState<Tab>('profile')
  const [profile, setProfile] = useState<Employee | null>(null)
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [payslips, setPayslips] = useState<Payslip[]>([])
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<Payslip | null>(null)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [leaveForm, setLeaveForm] = useState({
    leave_type: '',
    start_date: '',
    end_date: '',
    reason: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [
        employee,
        attendancePage,
        payslipPage,
        leavePage,
        leaveTypeList,
      ] = await Promise.all([
        fetchSelfProfile(),
        fetchSelfAttendance({ page_size: 100 }),
        fetchSelfPayslips({ page_size: 100 }),
        fetchSelfLeaveRequests({ page_size: 100 }),
        fetchSelfLeaveTypes(),
      ])
      setProfile(employee)
      setAttendance(attendancePage.results)
      setPayslips(payslipPage.results)
      setLeaveRequests(leavePage.results)
      setLeaveTypes(leaveTypeList)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const requestLeave = async () => {
    setSaving(true)
    try {
      await createSelfLeaveRequest(leaveForm)
      setLeaveOpen(false)
      setLeaveForm({
        leave_type: '',
        start_date: '',
        end_date: '',
        reason: '',
      })
      load()
    } catch {
      alert('Could not submit leave request. Check the dates and leave type.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout title="My Workspace">
      <PageHeader
        title="My Workspace"
        description="Your employee profile, attendance, payslips, and leave requests."
        actionLabel={tab === 'leave' ? '+ Request Leave' : undefined}
        onAction={
          tab === 'leave'
            ? () => {
                setLeaveForm({
                  leave_type: leaveTypes[0]?.id ?? '',
                  start_date: '',
                  end_date: '',
                  reason: '',
                })
                setLeaveOpen(true)
              }
            : undefined
        }
      />

      <div className="mb-5 flex gap-2 overflow-x-auto border-b border-slate-200 dark:border-slate-700">
        {(
          [
            ['profile', 'My Profile'],
            ['attendance', 'My Attendance'],
            ['payslips', 'My Payslips'],
            ['leave', 'My Leave'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              'whitespace-nowrap px-4 py-2 text-sm font-medium',
              tab === key
                ? 'border-b-2 border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'text-slate-500',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <Card className="p-5">
          {loading ? (
            <p className="text-sm text-slate-500">Loading profile...</p>
          ) : profile ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-xs text-slate-500">Employee</p>
                <p className="font-semibold">{profile.full_name}</p>
                <p className="text-sm text-slate-500">
                  {profile.badge_id || profile.employee_number}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Department</p>
                <p className="font-medium">{profile.department_name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Position</p>
                <p className="font-medium">{profile.position_name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="font-medium">{profile.email || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Phone</p>
                <p className="font-medium">{profile.phone || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Employment Status</p>
                <Badge variant="success">{profile.employment_status}</Badge>
              </div>
            </div>
          ) : null}
        </Card>
      )}

      {tab === 'attendance' && (
        <DataTable
          loading={loading}
          isEmpty={!loading && attendance.length === 0}
          emptyMessage="No attendance records."
          columns={[
            { key: 'date', label: 'Date' },
            { key: 'status', label: 'Status' },
            { key: 'in', label: 'Clock In' },
            { key: 'out', label: 'Clock Out' },
            { key: 'hours', label: 'Hours' },
          ]}
        >
          {attendance.map((record) => (
            <TableRow key={record.id}>
              <TableCell>{record.date}</TableCell>
              <TableCell className="capitalize">{record.status.replace('_', ' ')}</TableCell>
              <TableCell>{formatTime(record.clock_in)}</TableCell>
              <TableCell>{formatTime(record.clock_out)}</TableCell>
              <TableCell>{record.hours_worked || record.working_hours}h</TableCell>
            </TableRow>
          ))}
        </DataTable>
      )}

      {tab === 'payslips' && (
        <DataTable
          loading={loading}
          isEmpty={!loading && payslips.length === 0}
          emptyMessage="No payslips."
          columns={[
            { key: 'period', label: 'Payroll' },
            { key: 'gross', label: 'Gross' },
            { key: 'deductions', label: 'Deductions' },
            { key: 'net', label: 'Net Pay' },
            { key: 'action', label: '', className: 'w-16' },
          ]}
        >
          {payslips.map((payslip) => (
            <TableRow key={payslip.id}>
              <TableCell className="font-medium">{payslip.period_name}</TableCell>
              <TableCell>{money(payslip.gross_pay)}</TableCell>
              <TableCell>{money(payslip.total_deductions)}</TableCell>
              <TableCell className="font-semibold text-emerald-700">
                {money(payslip.net_pay)}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () =>
                    setDetail(await fetchSelfPayslip(payslip.id))
                  }
                >
                  <FileText className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </DataTable>
      )}

      {tab === 'leave' && (
        <DataTable
          loading={loading}
          isEmpty={!loading && leaveRequests.length === 0}
          emptyMessage="No leave requests."
          columns={[
            { key: 'type', label: 'Leave Type' },
            { key: 'dates', label: 'Dates' },
            { key: 'days', label: 'Days' },
            { key: 'status', label: 'Status' },
            { key: 'action', label: '', className: 'w-20' },
          ]}
        >
          {leaveRequests.map((request) => (
            <TableRow key={request.id}>
              <TableCell className="font-medium">
                {request.leave_type_name}
              </TableCell>
              <TableCell>
                {request.start_date} – {request.end_date}
              </TableCell>
              <TableCell>{request.days}</TableCell>
              <TableCell className="capitalize">{request.status}</TableCell>
              <TableCell>
                {['draft', 'pending'].includes(request.status) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      if (!confirm('Cancel this leave request?')) return
                      await cancelSelfLeaveRequest(request.id)
                      load()
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </DataTable>
      )}

      <Modal
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        title="Request Leave"
      >
        <div className="grid gap-4">
          <Select
            label="Leave Type"
            options={leaveTypes.map((leaveType) => ({
              value: leaveType.id,
              label: `${leaveType.name} (${leaveType.days_per_year} days/year)`,
            }))}
            value={leaveForm.leave_type}
            onChange={(event) =>
              setLeaveForm({ ...leaveForm, leave_type: event.target.value })
            }
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Start Date"
              type="date"
              value={leaveForm.start_date}
              onChange={(event) =>
                setLeaveForm({ ...leaveForm, start_date: event.target.value })
              }
            />
            <Input
              label="End Date"
              type="date"
              value={leaveForm.end_date}
              onChange={(event) =>
                setLeaveForm({ ...leaveForm, end_date: event.target.value })
              }
            />
          </div>
          <Input
            label="Reason"
            value={leaveForm.reason}
            onChange={(event) =>
              setLeaveForm({ ...leaveForm, reason: event.target.value })
            }
          />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setLeaveOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={requestLeave}
            disabled={
              saving ||
              !leaveForm.leave_type ||
              !leaveForm.start_date ||
              !leaveForm.end_date
            }
          >
            <Plus className="h-4 w-4" />
            {saving ? 'Submitting...' : 'Submit Request'}
          </Button>
        </div>
      </Modal>

      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={`Payslip — ${detail?.period_name || ''}`}
        size="lg"
      >
        {detail && (
          <div>
            <div className="mb-5 grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-slate-500">Gross</p>
                <p className="font-bold">{money(detail.gross_pay)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Deductions</p>
                <p className="font-bold">{money(detail.total_deductions)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Net</p>
                <p className="font-bold text-emerald-700">
                  {money(detail.net_pay)}
                </p>
              </div>
            </div>
            {detail.lines?.map((line) => (
              <div
                key={line.id}
                className="flex justify-between border-t border-slate-100 py-2 text-sm dark:border-slate-800"
              >
                <span>{line.description}</span>
                <span className={line.line_type === 'deduction' ? 'text-red-600' : ''}>
                  {line.line_type === 'deduction' ? '-' : ''}
                  {money(line.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </DashboardLayout>
  )
}
