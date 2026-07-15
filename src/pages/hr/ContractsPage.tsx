import { Pencil, Search, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  createContract,
  deleteContract,
  fetchContractOptions,
  fetchContracts,
  fetchDepartments,
  fetchEmployees,
  fetchPositions,
  updateContract,
} from '../../api/hr'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { DataTable, TableCell, TableRow } from '../../components/ui/DataTable'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { Select } from '../../components/ui/Select'
import type {
  ContractOption,
  Department,
  Employee,
  EmploymentContract,
  Position,
} from '../../types/hr'

const empty = {
  name: '', employee: '', position: '', department: '', shift: 'regular', work_type: 'office',
  start_date: '', end_date: '', wage_type: 'monthly', basic_salary: '', payment_frequency: 'monthly', status: 'draft',
}

function statusBadge(s: string) {
  if (s === 'active') return 'success'
  if (s === 'draft') return 'default'
  if (s === 'expired') return 'warning'
  return 'danger'
}

export function ContractsPage() {
  const [contracts, setContracts] = useState<EmploymentContract[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [contractOptions, setContractOptions] = useState<ContractOption[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<EmploymentContract | null>(null)
  const [form, setForm] = useState(empty)
  const [infinite, setInfinite] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [c, e, d, p, configuredOptions] = await Promise.all([
        fetchContracts({ search: search || undefined }),
        fetchEmployees(),
        fetchDepartments(),
        fetchPositions(),
        fetchContractOptions(),
      ])
      setContracts(c.results)
      setEmployees(e.results)
      setDepartments(d.results)
      setPositions(p)
      setContractOptions(configuredOptions)
    } finally { setLoading(false) }
  }, [search])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...empty, employee: employees[0]?.id ?? '', start_date: new Date().toISOString().slice(0, 10) })
    setInfinite(true)
    setModalOpen(true)
  }

  const openEdit = (c: EmploymentContract) => {
    setEditing(c)
    setForm({
      name: c.name, employee: c.employee, position: c.position || '', department: c.department || '',
      shift: c.shift, work_type: c.work_type, start_date: c.start_date, end_date: c.end_date || '',
      wage_type: c.wage_type, basic_salary: c.basic_salary, payment_frequency: c.payment_frequency, status: c.status,
    })
    setInfinite(!c.end_date)
    setModalOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        ...form,
        position: form.position || null,
        department: form.department || null,
        end_date: infinite ? null : form.end_date || null,
        basic_salary: form.basic_salary || '0',
      }
      if (editing) await updateContract(editing.id, payload)
      else await createContract(payload)
      setModalOpen(false)
      load()
    } catch { alert('Failed to save contract. Only one active contract per employee is allowed.') }
    finally { setSaving(false) }
  }

  const optionsFor = (category: ContractOption['category']) =>
    contractOptions
      .filter((option) => option.category === category)
      .map((option) => ({ value: option.code, label: option.name }))

  return (
    <DashboardLayout title="Contracts">
      <PageHeader title="Contracts" description="Employee contract management." actionLabel="+ Add Contract" onAction={openCreate} />
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input className="pl-9" placeholder="Search contracts..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <DataTable loading={loading} isEmpty={!loading && contracts.length === 0} emptyMessage="No contracts." columns={[
        { key: 'name', label: 'Contract' }, { key: 'emp', label: 'Employee' }, { key: 'wage', label: 'Wage' },
        { key: 'dates', label: 'Dates' }, { key: 'status', label: 'Status' }, { key: 'actions', label: '', className: 'w-24' },
      ]}>
        {contracts.map((c) => (
          <TableRow key={c.id}>
            <TableCell className="font-medium">{c.name}</TableCell>
            <TableCell>{c.employee_name}</TableCell>
            <TableCell className="capitalize">{c.wage_type} · {Number(c.basic_salary).toLocaleString()}</TableCell>
            <TableCell>{c.start_date} → {c.end_date || '∞'}</TableCell>
            <TableCell><Badge variant={statusBadge(c.status)}>{c.status}</Badge></TableCell>
            <TableCell>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={async () => { if (confirm('Terminate/disable contract?')) { await deleteContract(c.id); load() } }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </DataTable>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Contract' : 'New Contract'} size="lg">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Contract Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Select label="Employee" options={employees.map((e) => ({ value: e.id, label: e.full_name }))} value={form.employee} onChange={(e) => setForm({ ...form, employee: e.target.value })} />
          <Select label="Department" options={[{ value: '', label: 'None' }, ...departments.map((d) => ({ value: d.id, label: d.name }))]} value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          <Select label="Job Position" options={[{ value: '', label: 'None' }, ...positions.map((p) => ({ value: p.id, label: p.name }))]} value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
          <Select label="Shift" options={optionsFor('shift')} value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value })} />
          <Select label="Work Type" options={optionsFor('work_type')} value={form.work_type} onChange={(e) => setForm({ ...form, work_type: e.target.value })} />
          <Input label="Start Date" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={infinite} onChange={(e) => setInfinite(e.target.checked)} /> Infinite end date
            </label>
            {!infinite && <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />}
          </div>
          <Select label="Wage Type" options={optionsFor('wage_type')} value={form.wage_type} onChange={(e) => setForm({ ...form, wage_type: e.target.value })} />
          <Input label="Basic Salary / Rate" type="number" value={form.basic_salary} onChange={(e) => setForm({ ...form, basic_salary: e.target.value })} />
          <Select label="Payment Frequency" options={optionsFor('payment_frequency')} value={form.payment_frequency} onChange={(e) => setForm({ ...form, payment_frequency: e.target.value })} />
          <Select label="Status" options={[{ value: 'draft', label: 'Draft' }, { value: 'active', label: 'Active' }, { value: 'expired', label: 'Expired' }, { value: 'terminated', label: 'Terminated' }]} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.name || !form.employee}>{saving ? 'Saving...' : 'Save'}</Button>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
