import { Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  createEmployee,
  deleteEmployee,
  fetchDepartments,
  fetchEmployee,
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
import { cn } from '../../lib/cn'
import type { Department, EmergencyContact, Employee, Position } from '../../types/hr'

type Tab = 'personal' | 'work' | 'bank'

const emptyForm = {
  badge_id: '',
  first_name: '',
  middle_name: '',
  last_name: '',
  email: '',
  phone: '',
  address: '',
  country: 'Rwanda',
  city: '',
  gender: '',
  date_of_birth: '',
  qualification: '',
  experience: '0',
  marital_status: '',
  department: '',
  position: '',
  job_role: '',
  supervisor: '',
  work_location: '',
  employment_status: 'active',
  hire_date: '',
  bank_name: '',
  bank_account: '',
  bank_account_holder: '',
}

export function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [allEmployees, setAllEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('personal')
  const [editing, setEditing] = useState<Employee | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [contacts, setContacts] = useState<EmergencyContact[]>([{ name: '', relationship: '', phone: '' }])
  const [documents, setDocuments] = useState<{ name: string }[]>([{ name: '' }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [emp, dept, pos] = await Promise.all([
        fetchEmployees({ search: search || undefined }),
        fetchDepartments(),
        fetchPositions(),
      ])
      setEmployees(emp.results)
      setAllEmployees(emp.results)
      setDepartments(dept.results)
      setPositions(pos)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setContacts([{ name: '', relationship: '', phone: '' }])
    setDocuments([{ name: '' }])
    setTab('personal')
    setError('')
    setModalOpen(true)
  }

  const openEdit = async (emp: Employee) => {
    const full = await fetchEmployee(emp.id)
    setEditing(full)
    setForm({
      badge_id: full.badge_id || '',
      first_name: full.first_name,
      middle_name: full.middle_name || '',
      last_name: full.last_name,
      email: full.email || '',
      phone: full.phone || '',
      address: full.address || '',
      country: full.country || 'Rwanda',
      city: full.city || '',
      gender: full.gender || '',
      date_of_birth: full.date_of_birth || '',
      qualification: full.qualification || '',
      experience: String(full.experience || '0'),
      marital_status: full.marital_status || '',
      department: full.department || '',
      position: full.position || '',
      job_role: full.job_role || '',
      supervisor: full.supervisor || '',
      work_location: full.work_location || '',
      employment_status: full.employment_status,
      hire_date: full.hire_date || '',
      bank_name: full.bank_name || '',
      bank_account: full.bank_account || '',
      bank_account_holder: full.bank_account_holder || '',
    })
    setContacts(
      full.emergency_contacts?.length
        ? full.emergency_contacts.map((c) => ({ name: c.name, relationship: c.relationship, phone: c.phone }))
        : [{ name: '', relationship: '', phone: '' }],
    )
    setDocuments(
      full.documents?.length
        ? full.documents.map((d) => ({ name: d.name }))
        : [{ name: '' }],
    )
    setTab('personal')
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
        date_of_birth: form.date_of_birth || null,
        hire_date: form.hire_date || null,
        experience: form.experience || '0',
        emergency_contacts: contacts.filter((c) => c.name || c.phone),
        documents: documents.filter((d) => d.name),
      }
      if (editing) await updateEmployee(editing.id, payload)
      else await createEmployee(payload)
      setModalOpen(false)
      load()
    } catch {
      setError('Failed to save employee. Check required fields.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout title="Employees">
      <PageHeader title="Employees" description="Personal, work, and bank information." actionLabel="+ Add Employee" onAction={openCreate} />
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input placeholder="Search employees..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      <DataTable loading={loading} isEmpty={!loading && employees.length === 0} emptyMessage="No employees." columns={[
        { key: 'badge', label: 'Badge ID' }, { key: 'name', label: 'Name' }, { key: 'dept', label: 'Department' },
        { key: 'role', label: 'Job Role' }, { key: 'status', label: 'Status' }, { key: 'actions', label: '', className: 'w-24' },
      ]}>
        {employees.map((emp) => (
          <TableRow key={emp.id}>
            <TableCell className="font-mono text-xs">{emp.badge_id || emp.employee_number}</TableCell>
            <TableCell className="font-medium">{emp.full_name}</TableCell>
            <TableCell>{emp.department_name || '—'}</TableCell>
            <TableCell>{emp.job_role || emp.position_name || '—'}</TableCell>
            <TableCell><Badge variant={emp.employment_status === 'active' ? 'success' : 'default'}>{emp.employment_status}</Badge></TableCell>
            <TableCell>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => openEdit(emp)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={async () => { if (confirm(`Deactivate ${emp.full_name}?`)) { await deleteEmployee(emp.id); load() } }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </DataTable>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Employee' : 'New Employee'} size="lg">
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <div className="mb-4 flex gap-2 border-b border-slate-200 dark:border-slate-700">
          {([['personal', 'Personal'], ['work', 'Work'], ['bank', 'Bank']] as const).map(([k, label]) => (
            <button key={k} type="button" onClick={() => setTab(k)} className={cn('px-3 py-2 text-sm font-medium', tab === k ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-slate-500')}>{label}</button>
          ))}
        </div>

        {tab === 'personal' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Badge ID" value={form.badge_id} onChange={(e) => setForm({ ...form, badge_id: e.target.value })} />
            <Input label="First Name *" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            <Input label="Middle Name" value={form.middle_name} onChange={(e) => setForm({ ...form, middle_name: e.target.value })} />
            <Input label="Last Name *" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input label="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <Select label="Gender" options={[{ value: '', label: 'Select' }, { value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }]} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} />
            <Input label="Date of Birth" type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
            <Input label="Qualification" value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} />
            <Input label="Experience (years)" type="number" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} />
            <Select label="Marital Status" options={[{ value: '', label: 'Select' }, { value: 'single', label: 'Single' }, { value: 'married', label: 'Married' }, { value: 'divorced', label: 'Divorced' }, { value: 'widowed', label: 'Widowed' }]} value={form.marital_status} onChange={(e) => setForm({ ...form, marital_status: e.target.value })} />
            <div className="sm:col-span-2"><Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div className="sm:col-span-2">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium">Emergency Contacts</p>
                <Button size="sm" variant="secondary" onClick={() => setContacts([...contacts, { name: '', relationship: '', phone: '' }])}><Plus className="h-3 w-3" /> Add</Button>
              </div>
              {contacts.map((c, i) => (
                <div key={i} className="mb-2 grid gap-2 sm:grid-cols-4">
                  <Input placeholder="Name" value={c.name} onChange={(e) => { const n = [...contacts]; n[i] = { ...c, name: e.target.value }; setContacts(n) }} />
                  <Input placeholder="Relationship" value={c.relationship} onChange={(e) => { const n = [...contacts]; n[i] = { ...c, relationship: e.target.value }; setContacts(n) }} />
                  <Input placeholder="Phone" value={c.phone} onChange={(e) => { const n = [...contacts]; n[i] = { ...c, phone: e.target.value }; setContacts(n) }} />
                  <Button variant="ghost" size="sm" onClick={() => setContacts(contacts.filter((_, j) => j !== i))}><X className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'work' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Select label="Department" options={[{ value: '', label: 'None' }, ...departments.map((d) => ({ value: d.id, label: d.name }))]} value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            <Select label="Job Position" options={[{ value: '', label: 'None' }, ...positions.map((p) => ({ value: p.id, label: p.name }))]} value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
            <Input label="Job Role" value={form.job_role} onChange={(e) => setForm({ ...form, job_role: e.target.value })} />
            <Select label="Reporting Manager" options={[{ value: '', label: 'None' }, ...allEmployees.filter((e) => e.id !== editing?.id).map((e) => ({ value: e.id, label: e.full_name }))]} value={form.supervisor} onChange={(e) => setForm({ ...form, supervisor: e.target.value })} />
            <Input label="Work Location" value={form.work_location} onChange={(e) => setForm({ ...form, work_location: e.target.value })} />
            <Input label="Hire Date" type="date" value={form.hire_date} onChange={(e) => setForm({ ...form, hire_date: e.target.value })} />
            <div className="sm:col-span-2">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium">Documents (name)</p>
                <Button size="sm" variant="secondary" onClick={() => setDocuments([...documents, { name: '' }])}><Plus className="h-3 w-3" /> Add</Button>
              </div>
              {documents.map((d, i) => (
                <div key={i} className="mb-2 flex gap-2">
                  <Input placeholder="Document name" value={d.name} onChange={(e) => { const n = [...documents]; n[i] = { name: e.target.value }; setDocuments(n) }} />
                  <Button variant="ghost" size="sm" onClick={() => setDocuments(documents.filter((_, j) => j !== i))}><X className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'bank' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Bank Name" value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} />
            <Input label="Account Number" value={form.bank_account} onChange={(e) => setForm({ ...form, bank_account: e.target.value })} />
            <Input label="Account Holder Name" value={form.bank_account_holder} onChange={(e) => setForm({ ...form, bank_account_holder: e.target.value })} />
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.first_name || !form.last_name}>{saving ? 'Saving...' : 'Save'}</Button>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
