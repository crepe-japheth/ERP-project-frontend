import { Clock, LogIn, LogOut, Search } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { clockIn, clockOut, fetchAttendance, fetchEmployees } from '../../api/hr'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { DataTable, TableCell, TableRow } from '../../components/ui/DataTable'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/ui/PageHeader'
import { Select } from '../../components/ui/Select'
import type { Attendance, Employee } from '../../types/hr'

function statusBadge(status: string) {
  if (status === 'present') return 'success'
  if (status === 'late') return 'warning'
  if (status === 'absent') return 'danger'
  if (status === 'on_leave') return 'info'
  return 'default'
}

function formatTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('en-RW', { hour: '2-digit', minute: '2-digit' })
}

export function AttendancePage() {
  const [records, setRecords] = useState<Attendance[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [attData, empData] = await Promise.all([
        fetchAttendance({
          search: search || undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          employee: selectedEmployee || undefined,
        }),
        fetchEmployees(),
      ])
      setRecords(attData.results)
      setEmployees(empData.results)
    } finally {
      setLoading(false)
    }
  }, [search, dateFrom, dateTo, selectedEmployee])

  useEffect(() => {
    load()
  }, [load])

  const handleClockIn = async () => {
    if (!selectedEmployee) {
      alert('Select an employee first.')
      return
    }
    setActionLoading(true)
    try {
      await clockIn(selectedEmployee)
      load()
    } catch {
      alert('Clock-in failed. Employee may already be clocked in today.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleClockOut = async () => {
    if (!selectedEmployee) {
      alert('Select an employee first.')
      return
    }
    setActionLoading(true)
    try {
      await clockOut(selectedEmployee)
      load()
    } catch {
      alert('Clock-out failed. Ensure employee has clocked in first.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <DashboardLayout title="Attendance">
      <PageHeader
        title="Attendance"
        description="Track clock-in/out, working hours, and lateness."
      />

      <Card className="mb-6 p-4">
        <p className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">Quick Clock Actions</p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <Select
              label="Employee"
              options={[{ value: '', label: 'Select employee' }, ...employees.map((e) => ({ value: e.id, label: `${e.employee_number} — ${e.full_name}` }))]}
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
            />
          </div>
          <Button onClick={handleClockIn} disabled={actionLoading}>
            <LogIn className="mr-1.5 h-4 w-4" />
            Clock In
          </Button>
          <Button variant="secondary" onClick={handleClockOut} disabled={actionLoading}>
            <LogOut className="mr-1.5 h-4 w-4" />
            Clock Out
          </Button>
        </div>
      </Card>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
      </div>

      <DataTable
        loading={loading}
        isEmpty={!loading && records.length === 0}
        emptyMessage="No attendance records found."
        columns={[
          { key: 'date', label: 'Date' },
          { key: 'employee', label: 'Employee' },
          { key: 'in', label: 'Clock In' },
          { key: 'out', label: 'Clock Out' },
          { key: 'hours', label: 'Hours' },
          { key: 'late', label: 'Late' },
          { key: 'ot', label: 'OT' },
          { key: 'status', label: 'Status' },
        ]}
      >
        {records.map((rec) => (
          <TableRow key={rec.id}>
            <TableCell>{rec.date}</TableCell>
            <TableCell>
              <div>
                <p className="font-medium">{rec.employee_name}</p>
                <p className="text-xs text-slate-500">{rec.employee_number}</p>
              </div>
            </TableCell>
            <TableCell>{formatTime(rec.clock_in)}</TableCell>
            <TableCell>{formatTime(rec.clock_out)}</TableCell>
            <TableCell>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                {rec.working_hours}h
              </span>
            </TableCell>
            <TableCell>{rec.late_minutes > 0 ? `${rec.late_minutes}m` : '—'}</TableCell>
            <TableCell>{Number(rec.overtime_hours) > 0 ? `${rec.overtime_hours}h` : '—'}</TableCell>
            <TableCell>
              <Badge variant={statusBadge(rec.status)}>{rec.status.replace('_', ' ')}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </DataTable>
    </DashboardLayout>
  )
}
