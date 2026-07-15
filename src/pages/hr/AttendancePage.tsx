import { LogIn, LogOut, Pencil, Search, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  clockIn,
  clockOut,
  createAttendance,
  deleteAttendance,
  fetchAttendance,
  fetchEmployees,
  updateAttendance,
} from '../../api/hr'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { DataTable, TableCell, TableRow } from '../../components/ui/DataTable'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { Select } from '../../components/ui/Select'
import { useAuth } from '../../context/AuthContext'
import type { Attendance, Employee } from '../../types/hr'

function formatTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('en-RW', { hour: '2-digit', minute: '2-digit' })
}

export function AttendancePage() {
  const { hasPermission } = useAuth()
  const canCreate = hasPermission('hr.attendance.create')
  const canUpdate = hasPermission('hr.attendance.update')
  const canDelete = hasPermission('hr.attendance.delete')
  const [records, setRecords] = useState<Attendance[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Attendance | null>(null)
  const [form, setForm] = useState({
    employee: '',
    date: '',
    clock_in: '',
    clock_out: '',
    status: 'present',
    notes: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [att, emp] = await Promise.all([
        fetchAttendance({ search: search || undefined }),
        fetchEmployees(),
      ])
      setRecords(att.results)
      setEmployees(emp.results)
    } finally { setLoading(false) }
  }, [search])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm({
      employee: employees[0]?.id ?? '',
      date: new Date().toISOString().slice(0, 10),
      clock_in: '',
      clock_out: '',
      status: 'present',
      notes: '',
    })
    setModalOpen(true)
  }

  const openEdit = (record: Attendance) => {
    const toTime = (value: string | null) =>
      value
        ? new Date(value).toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
          })
        : ''
    setEditing(record)
    setForm({
      employee: record.employee,
      date: record.date,
      clock_in: toTime(record.clock_in),
      clock_out: toTime(record.clock_out),
      status: record.status,
      notes: record.notes || '',
    })
    setModalOpen(true)
  }

  const saveManual = async () => {
    setActionLoading(true)
    try {
      const payload = {
        employee: form.employee,
        date: form.date,
        clock_in: form.clock_in ? `${form.date}T${form.clock_in}:00` : null,
        clock_out: form.clock_out ? `${form.date}T${form.clock_out}:00` : null,
        status: form.status,
        notes: form.notes,
      }
      if (editing) await updateAttendance(editing.id, payload)
      else await createAttendance(payload)
      setModalOpen(false)
      load()
    } catch {
      alert('Could not save attendance. Check the date and clock times.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <DashboardLayout title="Attendance">
      <PageHeader
        title="Attendance"
        description="Clock in/out, manually record previous dates, and manage hours worked."
        actionLabel={canCreate ? '+ Manual Attendance' : undefined}
        onAction={canCreate ? openCreate : undefined}
      />
      {canCreate && (
      <Card className="mb-6 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <Select
              label="Employee"
              options={[{ value: '', label: 'Select employee' }, ...employees.map((e) => ({ value: e.id, label: `${e.badge_id || e.employee_number} — ${e.full_name}` }))]}
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
            />
          </div>
          {canCreate && <Button disabled={actionLoading || !selectedEmployee} onClick={async () => {
            setActionLoading(true)
            try { await clockIn(selectedEmployee); load() } catch { alert('Clock-in failed.') } finally { setActionLoading(false) }
          }}>
            <LogIn className="h-4 w-4" /> Clock In
          </Button>}
          <Button variant="secondary" disabled={actionLoading || !selectedEmployee} onClick={async () => {
            setActionLoading(true)
            try { await clockOut(selectedEmployee); load() } catch { alert('Clock-out failed.') } finally { setActionLoading(false) }
          }}>
            <LogOut className="h-4 w-4" /> Clock Out
          </Button>
        </div>
      </Card>
      )}
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input className="pl-9" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <DataTable loading={loading} isEmpty={!loading && records.length === 0} emptyMessage="No attendance records." columns={[
        { key: 'date', label: 'Date' }, { key: 'day', label: 'Day' }, { key: 'emp', label: 'Employee' },
        { key: 'in', label: 'Clock In' }, { key: 'out', label: 'Clock Out' },
        { key: 'hours', label: 'Hours Worked' }, { key: 'actions', label: '', className: 'w-24' },
      ]}>
        {records.map((r) => (
          <TableRow key={r.id}>
            <TableCell>{r.date}</TableCell>
            <TableCell>{r.day}</TableCell>
            <TableCell>
              <div><p className="font-medium">{r.employee_name}</p><p className="text-xs text-slate-500">{r.employee_number}</p></div>
            </TableCell>
            <TableCell>{formatTime(r.clock_in)}</TableCell>
            <TableCell>{formatTime(r.clock_out)}</TableCell>
            <TableCell>{r.hours_worked || r.working_hours}h</TableCell>
            <TableCell>
              <div className="flex gap-1">
                {canUpdate && <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>
                  <Pencil className="h-4 w-4" />
                </Button>}
                {canDelete && <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    if (!confirm('Delete this attendance record?')) return
                    await deleteAttendance(r.id)
                    load()
                  }}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </DataTable>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Attendance' : 'Manual Attendance'}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Select
              label="Employee"
              options={employees.map((employee) => ({
                value: employee.id,
                label: employee.full_name,
              }))}
              value={form.employee}
              onChange={(event) =>
                setForm({ ...form, employee: event.target.value })
              }
            />
          </div>
          <Input
            label="Date"
            type="date"
            value={form.date}
            onChange={(event) => setForm({ ...form, date: event.target.value })}
          />
          <Select
            label="Status"
            options={[
              { value: 'present', label: 'Present' },
              { value: 'absent', label: 'Absent' },
              { value: 'late', label: 'Late' },
              { value: 'half_day', label: 'Half Day' },
              { value: 'on_leave', label: 'On Leave' },
            ]}
            value={form.status}
            onChange={(event) =>
              setForm({ ...form, status: event.target.value })
            }
          />
          <Input
            label="Clock In"
            type="time"
            value={form.clock_in}
            onChange={(event) =>
              setForm({ ...form, clock_in: event.target.value })
            }
          />
          <Input
            label="Clock Out"
            type="time"
            value={form.clock_out}
            onChange={(event) =>
              setForm({ ...form, clock_out: event.target.value })
            }
          />
          <div className="sm:col-span-2">
            <Input
              label="Notes"
              value={form.notes}
              onChange={(event) =>
                setForm({ ...form, notes: event.target.value })
              }
            />
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Leave clock times empty to use the configured standard working hours.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={saveManual}
            disabled={actionLoading || !form.employee || !form.date}
          >
            {actionLoading ? 'Saving...' : 'Save Attendance'}
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
