import { FileText } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  createIndividualPayslip,
  fetchAllEmployees,
  fetchPayrollPeriods,
  fetchPayslip,
  fetchPayslips,
} from '../../api/hr'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Button } from '../../components/ui/Button'
import { DataTable, TableCell, TableRow } from '../../components/ui/DataTable'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { Select } from '../../components/ui/Select'
import type { Employee, PayrollPeriod, Payslip } from '../../types/hr'

function money(v: string | number) {
  return Number(v).toLocaleString('en-RW', { style: 'currency', currency: 'RWF', maximumFractionDigits: 0 })
}

export function PayslipsPage() {
  const [periods, setPeriods] = useState<PayrollPeriod[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [payslips, setPayslips] = useState<Payslip[]>([])
  const [periodId, setPeriodId] = useState('')
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<Payslip | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    employee: '',
    payroll_period: '',
    name: '',
    period_type: 'monthly',
    start_date: '',
    end_date: '',
    notes: '',
    force_new_payroll: false,
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [p, employeeList] = await Promise.all([
        fetchPayrollPeriods(),
        fetchAllEmployees(),
      ])
      setPeriods(p.results)
      setEmployees(employeeList)
      const selected = periodId || p.results[0]?.id || ''
      if (!periodId && selected) setPeriodId(selected)
      if (selected) {
        const ps = await fetchPayslips({ period: selected })
        setPayslips(ps.results)
      } else setPayslips([])
    } finally { setLoading(false) }
  }, [periodId])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()
    const monthStart = new Date(year, month, 1)
    const monthEnd = new Date(year, month + 1, 0)
    const dateValue = (value: Date) =>
      `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
    setForm({
      employee: employees[0]?.id ?? '',
      payroll_period: '',
      name: '',
      period_type: 'monthly',
      start_date: dateValue(monthStart),
      end_date: dateValue(monthEnd),
      notes: '',
      force_new_payroll: false,
    })
    setCreateOpen(true)
  }

  const handleCreate = async () => {
    setSaving(true)
    try {
      const created = await createIndividualPayslip({
        employee: form.employee,
        payroll_period: form.payroll_period || null,
        ...(form.payroll_period
          ? {}
          : {
              name: form.name,
              period_type: form.period_type,
              start_date: form.start_date,
              end_date: form.end_date,
              notes: form.notes,
              force_new_payroll: form.force_new_payroll,
            }),
      })
      setCreateOpen(false)
      setPeriodId(created.payroll_period)
      setDetail(created)
    } catch {
      alert(
        'Could not create the payslip. Check the employee contract, payroll status, and whether a payslip already exists.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout title="Payslips">
      <PageHeader
        title="Payslips"
        description="Employee payslips generated from payroll."
        actionLabel="+ Individual Payslip"
        onAction={openCreate}
      />
      <div className="mb-4 max-w-xs">
        <Select
          label="Payroll Period"
          options={periods.map((p) => ({ value: p.id, label: p.name }))}
          value={periodId}
          onChange={(e) => setPeriodId(e.target.value)}
        />
      </div>
      <DataTable loading={loading} isEmpty={!loading && payslips.length === 0} emptyMessage="No payslips for this period." columns={[
        { key: 'emp', label: 'Employee' }, { key: 'gross', label: 'Gross' }, { key: 'ded', label: 'Deductions' },
        { key: 'net', label: 'Net Pay' }, { key: 'actions', label: '', className: 'w-16' },
      ]}>
        {payslips.map((ps) => (
          <TableRow key={ps.id}>
            <TableCell>
              <div><p className="font-medium">{ps.employee_name}</p><p className="text-xs text-slate-500">{ps.employee_number}</p></div>
            </TableCell>
            <TableCell>{money(ps.gross_pay)}</TableCell>
            <TableCell>{money(ps.total_deductions)}</TableCell>
            <TableCell className="font-semibold text-emerald-700">{money(ps.net_pay)}</TableCell>
            <TableCell>
              <Button variant="ghost" size="sm" onClick={async () => setDetail(await fetchPayslip(ps.id))}>
                <FileText className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </DataTable>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Individual Payslip"
        size="lg"
      >
        <div className="grid gap-4">
          <Select
            label="Employee"
            options={employees.map((employee) => ({
              value: employee.id,
              label: `${employee.full_name} (${employee.badge_id || employee.employee_number})`,
            }))}
            value={form.employee}
            onChange={(event) =>
              setForm({ ...form, employee: event.target.value })
            }
          />
          <Select
            label="Existing Draft Payroll (optional)"
            options={[
              { value: '', label: 'Find or create payroll from dates' },
              ...periods
                .filter((period) => period.status === 'draft')
                .map((period) => ({
                  value: period.id,
                  label: `${period.name} (${period.start_date} – ${period.end_date})`,
                })),
            ]}
            value={form.payroll_period}
            onChange={(event) =>
              setForm({ ...form, payroll_period: event.target.value })
            }
          />

          {!form.payroll_period && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Start Date"
                  type="date"
                  value={form.start_date}
                  onChange={(event) =>
                    setForm({ ...form, start_date: event.target.value })
                  }
                />
                <Input
                  label="End Date"
                  type="date"
                  value={form.end_date}
                  onChange={(event) =>
                    setForm({ ...form, end_date: event.target.value })
                  }
                />
                <Select
                  label="Payroll Type"
                  options={[
                    { value: 'monthly', label: 'Monthly' },
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'biweekly', label: 'Biweekly' },
                    { value: 'daily', label: 'Daily' },
                  ]}
                  value={form.period_type}
                  onChange={(event) =>
                    setForm({ ...form, period_type: event.target.value })
                  }
                />
                <Input
                  label="New Payroll Name (optional)"
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  placeholder="Employee correction — July 2026"
                />
              </div>
              <Input
                label="Notes"
                value={form.notes}
                onChange={(event) =>
                  setForm({ ...form, notes: event.target.value })
                }
              />
              <label className="flex items-start gap-2 text-sm">
                <input
                  className="mt-1"
                  type="checkbox"
                  checked={form.force_new_payroll}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      force_new_payroll: event.target.checked,
                    })
                  }
                />
                <span>
                  Create a separate correction payroll even if another payroll
                  already covers these exact dates.
                </span>
              </label>
            </>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setCreateOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={
              saving ||
              !form.employee ||
              (!form.payroll_period && (!form.start_date || !form.end_date))
            }
          >
            {saving ? 'Creating...' : 'Create Payslip'}
          </Button>
        </div>
      </Modal>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={`Payslip — ${detail?.employee_name}`} size="lg">
        {detail && (
          <div>
            <div className="mb-4 grid grid-cols-3 gap-3 text-sm">
              <div><p className="text-slate-500">Gross</p><p className="font-bold">{money(detail.gross_pay)}</p></div>
              <div><p className="text-slate-500">Deductions</p><p className="font-bold">{money(detail.total_deductions)}</p></div>
              <div><p className="text-slate-500">Net</p><p className="font-bold text-emerald-700">{money(detail.net_pay)}</p></div>
            </div>
            <h4 className="mb-2 font-medium">Earnings</h4>
            <ul className="mb-4 space-y-1">
              {detail.lines?.filter((l) => l.line_type === 'earning').map((l) => (
                <li key={l.id} className="flex justify-between text-sm"><span>{l.description}</span><span>{money(l.amount)}</span></li>
              ))}
            </ul>
            <h4 className="mb-2 font-medium">Deductions</h4>
            <ul className="space-y-1">
              {detail.lines?.filter((l) => l.line_type === 'deduction').map((l) => (
                <li key={l.id} className="flex justify-between text-sm"><span>{l.description}</span><span className="text-red-600">-{money(l.amount)}</span></li>
              ))}
            </ul>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  )
}
