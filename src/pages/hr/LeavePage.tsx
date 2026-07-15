import { Check, Search, Send, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  approveLeaveRequest,
  cancelLeaveRequest,
  createLeaveRequest,
  fetchEmployees,
  fetchLeaveRequests,
  fetchLeaveTypes,
  rejectLeaveRequest,
  submitLeaveRequest,
} from '../../api/hr'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { DataTable, TableCell, TableRow } from '../../components/ui/DataTable'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { Select } from '../../components/ui/Select'
import { useAuth } from '../../context/AuthContext'
import type { Employee, LeaveRequest, LeaveType } from '../../types/hr'

const emptyForm = {
  employee: '',
  leave_type: '',
  start_date: '',
  end_date: '',
  reason: '',
}

function statusBadge(status: string) {
  if (status === 'approved') return 'success'
  if (status === 'pending') return 'warning'
  if (status === 'rejected') return 'danger'
  if (status === 'draft') return 'default'
  return 'info'
}

export function LeavePage() {
  const { hasPermission } = useAuth()
  const canCreate = hasPermission('hr.leave.create')
  const canUpdate = hasPermission('hr.leave.update')
  const canApprove = hasPermission('hr.leave.approve')
  const canReject = hasPermission('hr.leave.reject')
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [reqData, empData, types] = await Promise.all([
        fetchLeaveRequests({ search: search || undefined, status: filterStatus || undefined }),
        fetchEmployees(),
        fetchLeaveTypes(),
      ])
      setRequests(reqData.results)
      setEmployees(empData.results)
      setLeaveTypes(types)
    } finally {
      setLoading(false)
    }
  }, [search, filterStatus])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setForm({
      ...emptyForm,
      employee: employees[0]?.id ?? '',
      leave_type: leaveTypes[0]?.id ?? '',
    })
    setError('')
    setModalOpen(true)
  }

  const handleCreate = async () => {
    setSaving(true)
    setError('')
    try {
      const created = await createLeaveRequest(form)
      await submitLeaveRequest(created.id)
      setModalOpen(false)
      load()
    } catch {
      setError('Failed to create leave request.')
    } finally {
      setSaving(false)
    }
  }

  const handleApprove = async (id: string) => {
    try {
      await approveLeaveRequest(id)
      load()
    } catch {
      alert('Failed to approve request.')
    }
  }

  const handleReject = async (id: string) => {
    const reason = prompt('Rejection reason (optional):') ?? ''
    try {
      await rejectLeaveRequest(id, reason)
      load()
    } catch {
      alert('Failed to reject request.')
    }
  }

  const handleCancel = async (id: string) => {
    try {
      await cancelLeaveRequest(id)
      load()
    } catch {
      alert('Failed to cancel request.')
    }
  }

  return (
    <DashboardLayout title="Leave">
      <PageHeader
        title="Leave Management"
        description="Request, approve, and track employee leave."
        actionLabel={canCreate ? '+ New Request' : undefined}
        onAction={canCreate ? openCreate : undefined}
      />

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
        <Select
          options={[
            { value: '', label: 'All Statuses' },
            { value: 'draft', label: 'Draft' },
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' },
            { value: 'cancelled', label: 'Cancelled' },
          ]}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-40"
        />
      </div>

      <DataTable
        loading={loading}
        isEmpty={!loading && requests.length === 0}
        emptyMessage="No leave requests found."
        columns={[
          { key: 'employee', label: 'Employee' },
          { key: 'type', label: 'Type' },
          { key: 'dates', label: 'Dates' },
          { key: 'days', label: 'Days' },
          { key: 'status', label: 'Status' },
          { key: 'actions', label: '', className: 'w-28' },
        ]}
      >
        {requests.map((req) => (
          <TableRow key={req.id}>
            <TableCell>
              <div>
                <p className="font-medium">{req.employee_name}</p>
                <p className="text-xs text-slate-500">{req.employee_number}</p>
              </div>
            </TableCell>
            <TableCell>{req.leave_type_name}</TableCell>
            <TableCell>{req.start_date} → {req.end_date}</TableCell>
            <TableCell>{req.days}</TableCell>
            <TableCell>
              <Badge variant={statusBadge(req.status)}>{req.status}</Badge>
            </TableCell>
            <TableCell>
              <div className="flex gap-1">
                {req.status === 'pending' && (canApprove || canReject) && (
                  <>
                    {canApprove && <Button variant="ghost" size="sm" title="Approve" onClick={() => handleApprove(req.id)}>
                      <Check className="h-4 w-4 text-emerald-600" />
                    </Button>}
                    {canReject && <Button variant="ghost" size="sm" title="Reject" onClick={() => handleReject(req.id)}>
                      <X className="h-4 w-4 text-red-500" />
                    </Button>}
                  </>
                )}
                {canUpdate && (req.status === 'draft' || req.status === 'pending') && (
                  <Button variant="ghost" size="sm" title="Cancel" onClick={() => handleCancel(req.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </DataTable>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Leave Request">
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <div className="grid gap-4">
          <Select label="Employee" options={employees.map((e) => ({ value: e.id, label: e.full_name }))} value={form.employee} onChange={(e) => setForm({ ...form, employee: e.target.value })} />
          <Select label="Leave Type" options={leaveTypes.map((t) => ({ value: t.id, label: `${t.name} (${t.days_per_year} days/yr)` }))} value={form.leave_type} onChange={(e) => setForm({ ...form, leave_type: e.target.value })} />
          <Input label="Start Date" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
          <Input label="End Date" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} required />
          <Input label="Reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={saving || !form.start_date || !form.end_date}>
            <Send className="mr-1.5 h-4 w-4" />
            {saving ? 'Submitting...' : 'Submit Request'}
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
