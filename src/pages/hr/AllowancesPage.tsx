import { Pencil, Search, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  createAllowance,
  deleteAllowance,
  fetchAllowances,
  fetchEmployees,
  updateAllowance,
} from '../../api/hr'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { DataTable, TableCell, TableRow } from '../../components/ui/DataTable'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { Select } from '../../components/ui/Select'
import { CONDITION_FIELDS, CONDITION_OPERATORS, type Allowance, type Employee } from '../../types/hr'

const empty = {
  title: '',
  apply_every_payroll: true,
  one_time_date: '',
  include_all_active: true,
  is_taxable: true,
  is_fixed: true,
  is_condition_based: false,
  amount: '',
  condition_field: 'basic_pay',
  condition_operator: 'gte',
  condition_value: '',
  employee_ids: [] as string[],
}

export function AllowancesPage() {
  const [items, setItems] = useState<Allowance[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Allowance | null>(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [a, e] = await Promise.all([fetchAllowances({ search: search || undefined }), fetchEmployees()])
      setItems(a.results)
      setEmployees(e.results)
    } finally { setLoading(false) }
  }, [search])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm(empty)
    setModalOpen(true)
  }

  const openEdit = (a: Allowance) => {
    setEditing(a)
    setForm({
      title: a.title,
      apply_every_payroll: a.apply_every_payroll,
      one_time_date: a.one_time_date || '',
      include_all_active: a.include_all_active,
      is_taxable: a.is_taxable,
      is_fixed: a.is_fixed,
      is_condition_based: a.is_condition_based,
      amount: a.amount,
      condition_field: a.condition_field || 'basic_pay',
      condition_operator: a.condition_operator || 'gte',
      condition_value: a.condition_value || '',
      employee_ids: a.employee_ids || [],
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        ...form,
        one_time_date: form.apply_every_payroll ? null : form.one_time_date || null,
        amount: form.amount || '0',
        employee_ids: form.include_all_active ? [] : form.employee_ids,
      }
      if (editing) await updateAllowance(editing.id, payload)
      else await createAllowance(payload)
      setModalOpen(false)
      load()
    } catch { alert('Failed to save allowance.') }
    finally { setSaving(false) }
  }

  const toggleEmployee = (id: string) => {
    setForm((f) => ({
      ...f,
      employee_ids: f.employee_ids.includes(id)
        ? f.employee_ids.filter((x) => x !== id)
        : [...f.employee_ids, id],
    }))
  }

  return (
    <DashboardLayout title="Allowances">
      <PageHeader title="Allowances" description="Transport, meal, and other employee allowances." actionLabel="+ Add Allowance" onAction={openCreate} />
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input className="pl-9" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <DataTable loading={loading} isEmpty={!loading && items.length === 0} emptyMessage="No allowances." columns={[
        { key: 'title', label: 'Title' }, { key: 'amount', label: 'Amount' }, { key: 'mode', label: 'Mode' },
        { key: 'scope', label: 'Scope' }, { key: 'tax', label: 'Taxable' }, { key: 'actions', label: '', className: 'w-24' },
      ]}>
        {items.map((a) => (
          <TableRow key={a.id}>
            <TableCell className="font-medium">{a.title}</TableCell>
            <TableCell>{Number(a.amount).toLocaleString()}</TableCell>
            <TableCell>{a.is_condition_based ? 'Condition' : 'Fixed'}</TableCell>
            <TableCell>{a.include_all_active ? 'All active' : `${a.employee_ids?.length || 0} selected`}</TableCell>
            <TableCell><Badge variant={a.is_taxable ? 'warning' : 'success'}>{a.is_taxable ? 'Yes' : 'No'}</Badge></TableCell>
            <TableCell>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={async () => { if (confirm('Disable allowance?')) { await deleteAllowance(a.id); load() } }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </DataTable>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Allowance' : 'New Allowance'} size="lg">
        <div className="grid gap-3">
          <Input label="Allowance Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.apply_every_payroll} onChange={(e) => setForm({ ...form, apply_every_payroll: e.target.checked })} /> Apply on every payroll</label>
          {!form.apply_every_payroll && <Input label="One-time date" type="date" value={form.one_time_date} onChange={(e) => setForm({ ...form, one_time_date: e.target.value })} />}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.include_all_active} onChange={(e) => setForm({ ...form, include_all_active: e.target.checked })} /> Include all active employees</label>
          {!form.include_all_active && (
            <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 p-2 dark:border-slate-700">
              {employees.map((e) => (
                <label key={e.id} className="flex items-center gap-2 py-1 text-sm">
                  <input type="checkbox" checked={form.employee_ids.includes(e.id)} onChange={() => toggleEmployee(e.id)} />
                  {e.full_name}
                </label>
              ))}
            </div>
          )}
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2"><input type="radio" checked={form.is_taxable} onChange={() => setForm({ ...form, is_taxable: true })} /> Taxable</label>
            <label className="flex items-center gap-2"><input type="radio" checked={!form.is_taxable} onChange={() => setForm({ ...form, is_taxable: false })} /> Non-taxable</label>
          </div>
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2"><input type="radio" checked={form.is_fixed} onChange={() => setForm({ ...form, is_fixed: true, is_condition_based: false })} /> Fixed amount</label>
            <label className="flex items-center gap-2"><input type="radio" checked={form.is_condition_based} onChange={() => setForm({ ...form, is_condition_based: true, is_fixed: false })} /> Condition based</label>
          </div>
          {form.is_condition_based && (
            <div className="grid gap-3 sm:grid-cols-3">
              <Select label="If field" options={CONDITION_FIELDS} value={form.condition_field} onChange={(e) => setForm({ ...form, condition_field: e.target.value })} />
              <Select label="Condition" options={CONDITION_OPERATORS} value={form.condition_operator} onChange={(e) => setForm({ ...form, condition_operator: e.target.value })} />
              <Input label="Value" value={form.condition_value} onChange={(e) => setForm({ ...form, condition_value: e.target.value })} />
            </div>
          )}
          <Input label="Amount (applied when fixed, or when condition matches)" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.title}>{saving ? 'Saving...' : 'Save'}</Button>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
