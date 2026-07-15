import { ArrowRight, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  advancePayrollPeriod,
  createPayrollPeriod,
  fetchAllEmployees,
  fetchPayrollPeriods,
  generatePayroll,
} from '../../api/hr'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { DataTable, TableCell, TableRow } from '../../components/ui/DataTable'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { Select } from '../../components/ui/Select'
import type { Employee, PayrollPeriod } from '../../types/hr'

function money(v: string | number) {
  return Number(v).toLocaleString('en-RW', { style: 'currency', currency: 'RWF', maximumFractionDigits: 0 })
}

function statusBadge(s: string) {
  if (s === 'paid') return 'success'
  if (s === 'confirmed') return 'info'
  if (s === 'review_ongoing') return 'warning'
  return 'default'
}

export function PayrollPage() {
  const [periods, setPeriods] = useState<PayrollPeriod[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [genOpen, setGenOpen] = useState(false)
  const [genPeriod, setGenPeriod] = useState<PayrollPeriod | null>(null)
  const [excludeIds, setExcludeIds] = useState<string[]>([])
  const [createExcludeIds, setCreateExcludeIds] = useState<string[]>([])
  const [form, setForm] = useState({ name: '', period_type: 'monthly', start_date: '', end_date: '', notes: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [p, e] = await Promise.all([
        fetchPayrollPeriods(),
        fetchAllEmployees({ status: 'active' }),
      ])
      setPeriods(p.results)
      setEmployees(e)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    setSaving(true)
    try {
      await createPayrollPeriod({
        ...form,
        exclude_employee_ids: createExcludeIds,
      })
      setModalOpen(false)
      setCreateExcludeIds([])
      setForm({ name: '', period_type: 'monthly', start_date: '', end_date: '', notes: '' })
      load()
    } catch {
      alert(
        'Payroll could not be created. Check for overlapping dates and make sure every included employee has an active contract.',
      )
    }
    finally { setSaving(false) }
  }

  const handleGenerate = async () => {
    if (!genPeriod) return
    setSaving(true)
    try {
      await generatePayroll(genPeriod.id, excludeIds)
      setGenOpen(false)
      load()
    } catch { alert('Generate failed. Period must be draft and employees need active contracts.') }
    finally { setSaving(false) }
  }

  return (
    <DashboardLayout title="Payroll">
      <PageHeader
        title="Payroll"
        description="Create a payroll batch and automatically generate one payslip per included employee."
        actionLabel="+ Create Payroll"
        onAction={() => {
          setCreateExcludeIds([])
          setModalOpen(true)
        }}
      />
      <DataTable loading={loading} isEmpty={!loading && periods.length === 0} emptyMessage="No payroll periods." columns={[
        { key: 'name', label: 'Payroll' }, { key: 'dates', label: 'Period' }, { key: 'gross', label: 'Gross' },
        { key: 'ded', label: 'Deductions' }, { key: 'net', label: 'Total Pay' },
        { key: 'payslips', label: 'Payslips' }, { key: 'status', label: 'Status' },
        { key: 'actions', label: '', className: 'w-28' },
      ]}>
        {periods.map((p) => (
          <TableRow key={p.id}>
            <TableCell className="font-medium">{p.name}</TableCell>
            <TableCell>{p.start_date} → {p.end_date}</TableCell>
            <TableCell>{money(p.gross_pay)}</TableCell>
            <TableCell>{money(p.total_deductions)}</TableCell>
            <TableCell className="font-semibold text-emerald-700">{money(p.total_pay)}</TableCell>
            <TableCell>{p.payslip_count}</TableCell>
            <TableCell><Badge variant={statusBadge(p.status)}>{p.status.replace('_', ' ')}</Badge></TableCell>
            <TableCell>
              <div className="flex gap-1">
                {p.status === 'draft' && (
                  <Button variant="ghost" size="sm" title="Recalculate payroll" onClick={() => { setGenPeriod(p); setExcludeIds(p.excluded_employee_ids || []); setGenOpen(true) }}>
                    <RefreshCw className="h-4 w-4 text-emerald-600" />
                  </Button>
                )}
                {p.status !== 'paid' && (
                  <Button variant="ghost" size="sm" title="Advance" onClick={async () => { try { await advancePayrollPeriod(p.id); load() } catch { alert('Cannot advance.') } }}>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </DataTable>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Payroll" size="lg">
        <div className="grid gap-3">
          <Input label="Payroll Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="July 2026 Payroll" />
          <Select label="Type" options={[{ value: 'monthly', label: 'Monthly' }, { value: 'weekly', label: 'Weekly' }, { value: 'biweekly', label: 'Biweekly' }, { value: 'daily', label: 'Daily' }]} value={form.period_type} onChange={(e) => setForm({ ...form, period_type: e.target.value })} />
          <Input label="Start Date" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          <Input label="End Date" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              Employees to exclude
            </p>
            <p className="mb-2 text-xs text-slate-500">
              Every active employee is included by default.
            </p>
            <div className="max-h-52 overflow-y-auto rounded-lg border border-slate-200 p-2 dark:border-slate-700">
              {employees.map((employee) => (
                <label
                  key={employee.id}
                  className="flex items-center gap-2 py-1.5 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={createExcludeIds.includes(employee.id)}
                    onChange={() =>
                      setCreateExcludeIds((ids) =>
                        ids.includes(employee.id)
                          ? ids.filter((id) => id !== employee.id)
                          : [...ids, employee.id],
                      )
                    }
                  />
                  {employee.full_name}
                  <span className="text-slate-400">
                    ({employee.badge_id || employee.employee_number})
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreate}
            disabled={saving || !form.name || !form.start_date || !form.end_date}
          >
            {saving ? 'Creating Payroll...' : 'Create Payroll & Payslips'}
          </Button>
        </div>
      </Modal>

      <Modal open={genOpen} onClose={() => setGenOpen(false)} title={`Recalculate — ${genPeriod?.name}`} size="lg">
        <p className="mb-3 text-sm text-slate-500">Update exclusions and regenerate all payslips in this draft payroll.</p>
        <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200 p-2 dark:border-slate-700">
          {employees.map((e) => (
            <label key={e.id} className="flex items-center gap-2 py-1.5 text-sm">
              <input
                type="checkbox"
                checked={excludeIds.includes(e.id)}
                onChange={() => setExcludeIds((ids) => ids.includes(e.id) ? ids.filter((x) => x !== e.id) : [...ids, e.id])}
              />
              {e.full_name} <span className="text-slate-400">({e.badge_id || e.employee_number})</span>
            </label>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setGenOpen(false)}>Cancel</Button>
          <Button onClick={handleGenerate} disabled={saving}>{saving ? 'Recalculating...' : 'Recalculate Payslips'}</Button>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
