import { LogIn, LogOut, Search } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { clockIn, clockOut, fetchAttendance, fetchEmployees } from '../../api/hr'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { DataTable, TableCell, TableRow } from '../../components/ui/DataTable'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/ui/PageHeader'
import { Select } from '../../components/ui/Select'
import type { Attendance, Employee } from '../../types/hr'

function formatTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('en-RW', { hour: '2-digit', minute: '2-digit' })
}

export function AttendancePage() {
  const [records, setRecords] = useState<Attendance[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

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

  return (
    <DashboardLayout title="Attendance">
      <PageHeader title="Attendance" description="Clock in/out and hours worked — used for daily/hourly payroll." />
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
          <Button disabled={actionLoading || !selectedEmployee} onClick={async () => {
            setActionLoading(true)
            try { await clockIn(selectedEmployee); load() } catch { alert('Clock-in failed.') } finally { setActionLoading(false) }
          }}>
            <LogIn className="h-4 w-4" /> Clock In
          </Button>
          <Button variant="secondary" disabled={actionLoading || !selectedEmployee} onClick={async () => {
            setActionLoading(true)
            try { await clockOut(selectedEmployee); load() } catch { alert('Clock-out failed.') } finally { setActionLoading(false) }
          }}>
            <LogOut className="h-4 w-4" /> Clock Out
          </Button>
        </div>
      </Card>
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input className="pl-9" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <DataTable loading={loading} isEmpty={!loading && records.length === 0} emptyMessage="No attendance records." columns={[
        { key: 'date', label: 'Date' }, { key: 'day', label: 'Day' }, { key: 'emp', label: 'Employee' },
        { key: 'in', label: 'Clock In' }, { key: 'out', label: 'Clock Out' }, { key: 'hours', label: 'Hours Worked' },
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
          </TableRow>
        ))}
      </DataTable>
    </DashboardLayout>
  )
}
