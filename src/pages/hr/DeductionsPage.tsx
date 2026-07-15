import { Pencil, Search, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  createDeduction,
  deleteDeduction,
  fetchDeductions,
  fetchEmployees,
  updateDeduction,
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
import { CONDITION_FIELDS, CONDITION_OPERATORS, type Deduction, type Employee } from '../../types/hr'

const empty = {
  title: '',
  apply_every_payroll: true,
  one_time_date: '',
  include_all_active: true,
  is_tax: false,
  is_pretax: false,
  is_fixed: true,
  is_condition_based: false,
  amount: '',
  condition_field: 'basic_pay',
  condition_operator: 'gte',
  condition_value: '',
  employee_ids: [] as string[],
}

export function DeductionsPage() {
  const { hasPermission } = useAuth()
  const canCreate = hasPermission('hr.payroll.create')
  const canUpdate = hasPermission('hr.payroll.update')
  const canDelete = hasPermission('hr.payroll.delete')
  const [items, setItems] = useState<Deduction[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Deduction | null>(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [d, e] = await Promise.all([fetchDeductions({ search: search || undefined }), fetchEmployees()])
      setItems(d.results)
      setEmployees(e.results)
    } finally { setLoading(false) }
  }, [search])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditing(null); setForm(empty); setModalOpen(true) }

  const openEdit = (d: Deduction) => {
    setEditing(d)
    setForm({
      title: d.title,
      apply_every_payroll: d.apply_every_payroll,
      one_time_date: d.one_time_date || '',
      include_all_active: d.include_all_active,
      is_tax: d.is_tax,
      is_pretax: d.is_pretax,
      is_fixed: d.is_fixed,
      is_condition_based: d.is_condition_based,
      amount: d.amount,
      condition_field: d.condition_field || 'basic_pay',
      condition_operator: d.condition_operator || 'gte',
      condition_value: d.condition_value || '',
      employee_ids: d.employee_ids || [],
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
      if (editing) await updateDeduction(editing.id, payload)
      else await createDeduction(payload)
      setModalOpen(false)
      load()
    } catch { alert('Failed to save deduction.') }
    finally { setSaving(false) }
  }

  return (
    <DashboardLayout title="Deductions">
      <PageHeader title="Deductions" description="Tax, social security, and other deductions." actionLabel={canCreate ? '+ Add Deduction' : undefined} onAction={canCreate ? openCreate : undefined} />
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input className="pl-9" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <DataTable loading={loading} isEmpty={!loading && items.length === 0} emptyMessage="No deductions." columns={[
        { key: 'title', label: 'Title' }, { key: 'amount', label: 'Amount' }, { key: 'flags', label: 'Flags' },
        { key: 'mode', label: 'Mode' }, { key: 'actions', label: '', className: 'w-24' },
      ]}>
        {items.map((d) => (
          <TableRow key={d.id}>
            <TableCell className="font-medium">{d.title}</TableCell>
            <TableCell>{Number(d.amount).toLocaleString()}</TableCell>
            <TableCell>
              <div className="flex gap-1">
                {d.is_tax && <Badge variant="warning">Tax</Badge>}
                {d.is_pretax && <Badge variant="info">Pre-tax</Badge>}
              </div>
            </TableCell>
            <TableCell>{d.is_condition_based ? 'Condition' : 'Fixed'}</TableCell>
            <TableCell>
              <div className="flex gap-1">
                {canUpdate && <Button variant="ghost" size="sm" onClick={() => openEdit(d)}><Pencil className="h-4 w-4" /></Button>}
                {canDelete && <Button variant="ghost" size="sm" onClick={async () => { if (confirm('Disable deduction?')) { await deleteDeduction(d.id); load() } }}><Trash2 className="h-4 w-4 text-red-500" /></Button>}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </DataTable>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Deduction' : 'New Deduction'} size="lg">
        <div className="grid gap-3">
          <Input label="Deduction Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.apply_every_payroll} onChange={(e) => setForm({ ...form, apply_every_payroll: e.target.checked })} /> Apply on every payroll</label>
          {!form.apply_every_payroll && <Input label="One-time date" type="date" value={form.one_time_date} onChange={(e) => setForm({ ...form, one_time_date: e.target.value })} />}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.include_all_active} onChange={(e) => setForm({ ...form, include_all_active: e.target.checked })} /> Include all active employees</label>
          {!form.include_all_active && (
            <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 p-2 dark:border-slate-700">
              {employees.map((e) => (
                <label key={e.id} className="flex items-center gap-2 py-1 text-sm">
                  <input type="checkbox" checked={form.employee_ids.includes(e.id)} onChange={() => setForm((f) => ({
                    ...f,
                    employee_ids: f.employee_ids.includes(e.id) ? f.employee_ids.filter((x) => x !== e.id) : [...f.employee_ids, e.id],
                  }))} />
                  {e.full_name}
                </label>
              ))}
            </div>
          )}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_tax} onChange={(e) => setForm({ ...form, is_tax: e.target.checked })} /> Is tax</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_pretax} onChange={(e) => setForm({ ...form, is_pretax: e.target.checked })} /> Is pre-tax (reduces taxable gross)</label>
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2"><input type="radio" checked={form.is_fixed} onChange={() => setForm({ ...form, is_fixed: true, is_condition_based: false })} /> Fixed amount</label>
            <label className="flex items-center gap-2"><input type="radio" checked={form.is_condition_based} onChange={() => setForm({ ...form, is_condition_based: true, is_fixed: false })} /> Condition based</label>
          </div>
          {form.is_condition_based && (
            <div className="grid gap-3 sm:grid-cols-3">
              <Select label="Field" options={CONDITION_FIELDS} value={form.condition_field} onChange={(e) => setForm({ ...form, condition_field: e.target.value })} />
              <Select label="Condition" options={CONDITION_OPERATORS} value={form.condition_operator} onChange={(e) => setForm({ ...form, condition_operator: e.target.value })} />
              <Input label="Value" value={form.condition_value} onChange={(e) => setForm({ ...form, condition_value: e.target.value })} />
            </div>
          )}
          <Input label="Amount" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.title}>{saving ? 'Saving...' : 'Save'}</Button>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
