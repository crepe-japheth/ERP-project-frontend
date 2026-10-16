import { CalendarDays, ChevronLeft, ChevronRight, FileText, Plus } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
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
import {
  createMyAvailability,
  deleteMyAvailability,
  fetchMyAvailability,
  fetchMyShifts,
} from '../api/scheduling'
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
import {
  addDays,
  formatDayHeading,
  formatShiftTime,
  formatWeekRange,
  startOfWeekMonday,
  toIsoDate,
} from '../lib/week'
import type {
  Attendance,
  Employee,
  LeaveRequest,
  LeaveType,
  Payslip,
} from '../types/hr'
import type { EmployeeAvailability, Shift } from '../types/scheduling'

type Tab = 'profile' | 'attendance' | 'payslips' | 'leave' | 'schedule' | 'availability'

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
  const [myShifts, setMyShifts] = useState<Shift[]>([])
  const [availability, setAvailability] = useState<EmployeeAvailability[]>([])
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday())
  const [availabilityOpen, setAvailabilityOpen] = useState(false)
  const [availabilityForm, setAvailabilityForm] = useState({
    kind: 'unavailable' as 'unavailable' | 'preferred',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    notes: '',
  })
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
      const weekEnd = addDays(weekStart, 6)
      const [
        employee,
        attendancePage,
        payslipPage,
        leavePage,
        leaveTypeList,
        shifts,
        availabilityRows,
      ] = await Promise.all([
        fetchSelfProfile(),
        fetchSelfAttendance({ page_size: 100 }),
        fetchSelfPayslips({ page_size: 100 }),
        fetchSelfLeaveRequests({ page_size: 100 }),
        fetchSelfLeaveTypes(),
        fetchMyShifts({
          start: toIsoDate(weekStart),
          end: toIsoDate(weekEnd),
        }).catch(() => []),
        fetchMyAvailability().catch(() => []),
      ])
      setProfile(employee)
      setAttendance(attendancePage.results)
      setPayslips(payslipPage.results)
      setLeaveRequests(leavePage.results)
      setLeaveTypes(leaveTypeList)
      setMyShifts(shifts)
      setAvailability(availabilityRows)
    } finally {
      setLoading(false)
    }
  }, [weekStart])

  useEffect(() => {
    load()
  }, [load])

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => formatDayHeading(addDays(weekStart, index))),
    [weekStart],
  )
  const shiftsByDate = useMemo(() => {
    const map = new Map<string, Shift[]>()
    myShifts.forEach((shift) => {
      const current = map.get(shift.date) ?? []
      current.push(shift)
      map.set(shift.date, current)
    })
    return map
  }, [myShifts])

  const saveAvailability = async () => {
    setSaving(true)
    try {
      await createMyAvailability({
        kind: availabilityForm.kind,
        start_date: availabilityForm.start_date,
        end_date: availabilityForm.end_date || availabilityForm.start_date,
        ...(availabilityForm.start_time && availabilityForm.end_time
          ? {
              start_time: availabilityForm.start_time,
              end_time: availabilityForm.end_time,
            }
          : {}),
        notes: availabilityForm.notes,
      })
      setAvailabilityOpen(false)
      load()
    } catch {
      alert('Could not save availability. Check the dates and times.')
    } finally {
      setSaving(false)
    }
  }

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
        description="Your employee profile, published timetable, availability, attendance, payslips, and leave."
        actionLabel={
          tab === 'leave'
            ? '+ Request Leave'
            : tab === 'availability'
              ? '+ Add availability'
              : undefined
        }
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
            : tab === 'availability'
              ? () => {
                  setAvailabilityForm({
                    kind: 'unavailable',
                    start_date: '',
                    end_date: '',
                    start_time: '',
                    end_time: '',
                    notes: '',
                  })
                  setAvailabilityOpen(true)
                }
              : undefined
        }
      />

      <div className="mb-5 flex gap-2 overflow-x-auto border-b border-slate-200 dark:border-slate-700">
        {(
          [
            ['profile', 'My Profile'],
            ['schedule', 'My Schedule'],
            ['availability', 'Availability'],
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

      {tab === 'schedule' && (
        <Card className="p-5">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setWeekStart(addDays(weekStart, -7))}
              aria-label="Previous week"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <CalendarDays className="h-4 w-4 text-emerald-600" />
              {formatWeekRange(weekStart)}
            </span>
            <button
              type="button"
              className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setWeekStart(addDays(weekStart, 7))}
              aria-label="Next week"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <Button size="sm" variant="secondary" onClick={() => setWeekStart(startOfWeekMonday())}>
              This week
            </Button>
          </div>
          {loading ? (
            <p className="text-sm text-slate-500">Loading timetable...</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
              {weekDays.map((day) => {
                const items = shiftsByDate.get(day.iso) ?? []
                return (
                  <div
                    key={day.iso}
                    className={cn(
                      'rounded-xl border border-slate-100 p-3 dark:border-slate-800',
                      day.isToday && 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900',
                    )}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {day.weekday}
                    </p>
                    <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                      {day.date}
                    </p>
                    {items.length === 0 ? (
                      <p className="text-xs text-slate-400">Off / unpublished</p>
                    ) : (
                      items.map((shift) => (
                        <div
                          key={shift.id}
                          className="mb-2 rounded-lg px-2 py-1.5 text-xs"
                          style={{
                            backgroundColor: `${shift.color}22`,
                            borderLeft: `3px solid ${shift.color}`,
                            color: shift.color,
                          }}
                        >
                          <p className="font-semibold">
                            {formatShiftTime(shift.starts_at)} – {formatShiftTime(shift.ends_at)}
                          </p>
                          <p className="opacity-80">
                            {shift.position_name || shift.template_name || 'Shift'}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      )}

      {tab === 'availability' && (
        <DataTable
          loading={loading}
          isEmpty={!loading && availability.length === 0}
          emptyMessage="No availability windows yet. Add times you cannot work, or preferred hours."
          columns={[
            { key: 'kind', label: 'Type' },
            { key: 'dates', label: 'Dates' },
            { key: 'hours', label: 'Hours' },
            { key: 'notes', label: 'Notes' },
            { key: 'action', label: '', className: 'w-20' },
          ]}
        >
          {availability.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="capitalize">
                {row.kind === 'preferred' ? 'Preferred hours' : 'Unavailable'}
              </TableCell>
              <TableCell>
                {row.start_date}
                {row.end_date !== row.start_date ? ` – ${row.end_date}` : ''}
              </TableCell>
              <TableCell>
                {row.start_time && row.end_time
                  ? `${row.start_time.slice(0, 5)} – ${row.end_time.slice(0, 5)}`
                  : 'All day'}
              </TableCell>
              <TableCell>{row.notes || '—'}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    if (!confirm('Remove this availability window?')) return
                    await deleteMyAvailability(row.id)
                    load()
                  }}
                >
                  Remove
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </DataTable>
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
        open={availabilityOpen}
        onClose={() => setAvailabilityOpen(false)}
        title="Add availability"
      >
        <div className="grid gap-4">
          <Select
            label="Type"
            value={availabilityForm.kind}
            onChange={(event) =>
              setAvailabilityForm({
                ...availabilityForm,
                kind: event.target.value as 'unavailable' | 'preferred',
              })
            }
            options={[
              { value: 'unavailable', label: 'Unavailable (blocks scheduling)' },
              { value: 'preferred', label: 'Preferred hours (warning only)' },
            ]}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Start date"
              type="date"
              value={availabilityForm.start_date}
              onChange={(event) =>
                setAvailabilityForm({ ...availabilityForm, start_date: event.target.value })
              }
            />
            <Input
              label="End date"
              type="date"
              value={availabilityForm.end_date}
              onChange={(event) =>
                setAvailabilityForm({ ...availabilityForm, end_date: event.target.value })
              }
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Start time (optional)"
              type="time"
              value={availabilityForm.start_time}
              onChange={(event) =>
                setAvailabilityForm({ ...availabilityForm, start_time: event.target.value })
              }
            />
            <Input
              label="End time (optional)"
              type="time"
              value={availabilityForm.end_time}
              onChange={(event) =>
                setAvailabilityForm({ ...availabilityForm, end_time: event.target.value })
              }
            />
          </div>
          <Input
            label="Notes"
            value={availabilityForm.notes}
            onChange={(event) =>
              setAvailabilityForm({ ...availabilityForm, notes: event.target.value })
            }
          />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setAvailabilityOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={saveAvailability}
            disabled={
              saving ||
              !availabilityForm.start_date ||
              (availabilityForm.kind === 'preferred' &&
                (!availabilityForm.start_time || !availabilityForm.end_time))
            }
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </Modal>

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
