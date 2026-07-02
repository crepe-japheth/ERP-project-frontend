import { Pencil, Search, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  createEmployee,
  deleteEmployee,
  fetchBranches,
  fetchDepartments,
  fetchEmployees,
  fetchPositions,
  updateEmployee,
} from '../../api/hr'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { DataTable, TableCell, TableRow } from '../../components/ui/DataTable'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { Select } from '../../components/ui/Select'
import type { Branch, Department, Employee, Position } from '../../types/hr'

const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
]

const EMPLOYMENT_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'terminated', label: 'Terminated' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'retired', label: 'Retired' },
]

const SALARY_TYPES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'daily', label: 'Daily' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'contract', label: 'Contract' },
  { value: 'commission', label: 'Commission' },
]

const CONTRACT_TYPES = [
  { value: 'permanent', label: 'Permanent' },
  { value: 'fixed_term', label: 'Fixed Term' },
  { value: 'probation', label: 'Probation' },
  { value: 'intern', label: 'Intern' },
  { value: 'consultant', label: 'Consultant' },
]

const emptyForm = {
  first_name: '',
  last_name: '',
  national_id: '',
  passport: '',
  gender: '',
  date_of_birth: '',
  nationality: 'Rwandan',
  phone: '',
  email: '',
  address: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  hire_date: '',
  employment_status: 'active',
  department: '',
  position: '',
  supervisor: '',
  branch: '',
  contract_type: 'permanent',
  salary_type: 'monthly',
}

function statusBadge(status: string) {
  if (status === 'active') return 'success'
  if (status === 'suspended') return 'warning'
  if (status === 'terminated') return 'danger'
  return 'default'
}

export function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [empData, deptData, posData, branchData] = await Promise.all([
        fetchEmployees({
          search: search || undefined,
          department: filterDept || undefined,
          status: filterStatus || undefined,
        }),
        fetchDepartments(),
        fetchPositions(),
        fetchBranches(),
      ])
      setEmployees(empData.results)
      setDepartments(deptData.results)
      setPositions(posData)
      setBranches(branchData)
    } finally {
      setLoading(false)
    }
  }, [search, filterDept, filterStatus])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm({
      ...emptyForm,
      department: departments[0]?.id ?? '',
      position: positions[0]?.id ?? '',
      branch: branches[0]?.id ?? '',
    })
    setError('')
    setModalOpen(true)
  }

  const openEdit = (emp: Employee) => {
    setEditing(emp)
    setForm({
      first_name: emp.first_name,
      last_name: emp.last_name,
      national_id: emp.national_id ?? '',
      passport: emp.passport ?? '',
      gender: emp.gender ?? '',
      date_of_birth: emp.date_of_birth ?? '',
      nationality: emp.nationality ?? 'Rwandan',
      phone: emp.phone ?? '',
      email: emp.email ?? '',
      address: emp.address ?? '',
      emergency_contact_name: emp.emergency_contact_name ?? '',
      emergency_contact_phone: emp.emergency_contact_phone ?? '',
      hire_date: emp.hire_date ?? '',
      employment_status: emp.employment_status,
      department: emp.department ?? '',
      position: emp.position ?? '',
      supervisor: emp.supervisor ?? '',
      branch: emp.branch ?? '',
      contract_type: emp.contract_type,
      salary_type: emp.salary_type,
    })
    setError('')
    setModalOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        department: form.department || null,
        position: form.position || null,
        supervisor: form.supervisor || null,
        branch: form.branch || null,
        date_of_birth: form.date_of_birth || null,
        hire_date: form.hire_date || null,
        gender: form.gender || '',
      }
      if (editing) {
        await updateEmployee(editing.id, payload)
      } else {
        await createEmployee(payload)
      }
      setModalOpen(false)
      load()
    } catch {
      setError('Failed to save employee. Check required fields.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (emp: Employee) => {
    if (!confirm(`Deactivate employee "${emp.full_name}"?`)) return
    try {
      await deleteEmployee(emp.id)
      load()
    } catch {
      alert('Failed to deactivate employee.')
    }
  }

  return (
    <DashboardLayout title="Employees">
      <PageHeader
        title="Employees"
        description="Manage employee profiles, contracts, and assignments."
        actionLabel="+ Add Employee"
        onAction={openCreate}
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name, number, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={[{ value: '', label: 'All Departments' }, ...departments.map((d) => ({ value: d.id, label: d.name }))]}
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="w-44"
        />
        <Select
          options={[{ value: '', label: 'All Statuses' }, ...EMPLOYMENT_STATUSES]}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-40"
        />
      </div>

      <DataTable
        loading={loading}
        isEmpty={!loading && employees.length === 0}
        emptyMessage="No employees found."
        columns={[
          { key: 'number', label: 'Number' },
          { key: 'name', label: 'Name' },
          { key: 'department', label: 'Department' },
          { key: 'position', label: 'Position' },
          { key: 'phone', label: 'Phone' },
          { key: 'status', label: 'Status' },
          { key: 'actions', label: '', className: 'w-24' },
        ]}
      >
        {employees.map((emp) => (
          <TableRow key={emp.id}>
            <TableCell className="font-mono text-xs">{emp.employee_number}</TableCell>
            <TableCell className="font-medium">{emp.full_name}</TableCell>
            <TableCell>{emp.department_name || '—'}</TableCell>
            <TableCell>{emp.position_name || '—'}</TableCell>
            <TableCell>{emp.phone || '—'}</TableCell>
            <TableCell>
              <Badge variant={statusBadge(emp.employment_status)}>
                {emp.employment_status}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => openEdit(emp)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(emp)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </DataTable>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Employee' : 'New Employee'}
        size="lg"
      >
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="First Name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
          <Input label="Last Name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required />
          <Input label="National ID" value={form.national_id} onChange={(e) => setForm({ ...form, national_id: e.target.value })} />
          <Input label="Passport" value={form.passport} onChange={(e) => setForm({ ...form, passport: e.target.value })} />
          <Select label="Gender" options={[{ value: '', label: 'Select' }, ...GENDERS]} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} />
          <Input label="Date of Birth" type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
          <Input label="Nationality" value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Hire Date" type="date" value={form.hire_date} onChange={(e) => setForm({ ...form, hire_date: e.target.value })} />
          <Select label="Department" options={[{ value: '', label: 'None' }, ...departments.map((d) => ({ value: d.id, label: d.name }))]} value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          <Select label="Position" options={[{ value: '', label: 'None' }, ...positions.map((p) => ({ value: p.id, label: p.name }))]} value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
          <Select label="Branch" options={[{ value: '', label: 'None' }, ...branches.map((b) => ({ value: b.id, label: b.name }))]} value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} />
          <Select label="Employment Status" options={EMPLOYMENT_STATUSES} value={form.employment_status} onChange={(e) => setForm({ ...form, employment_status: e.target.value })} />
          <Select label="Contract Type" options={CONTRACT_TYPES} value={form.contract_type} onChange={(e) => setForm({ ...form, contract_type: e.target.value })} />
          <Select label="Salary Type" options={SALARY_TYPES} value={form.salary_type} onChange={(e) => setForm({ ...form, salary_type: e.target.value })} />
          <Input label="Emergency Contact" value={form.emergency_contact_name} onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })} />
          <Input label="Emergency Phone" value={form.emergency_contact_phone} onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })} />
          <div className="sm:col-span-2">
            <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.first_name || !form.last_name}>
            {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
