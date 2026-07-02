import { ArrowRight, FileText, Play } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  advancePayrollPeriod,
  createAdvance,
  createLoan,
  createPayrollPeriod,
  fetchAdvances,
  fetchAllowanceReport,
  fetchBankTransferReport,
  fetchCompensations,
  fetchDeductionReport,
  fetchDeductionRules,
  fetchEmployeeCostReport,
  fetchEmployees,
  fetchLoans,
  fetchPayrollPeriods,
  fetchPayrollSummary,
  fetchPayslip,
  fetchPayslips,
  fetchSalaryComponents,
  fetchTaxReport,
  generatePayroll,
  updateCompensation,
} from '../../api/hr'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { DataTable, TableCell, TableRow } from '../../components/ui/DataTable'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { Select } from '../../components/ui/Select'
import { cn } from '../../lib/cn'
import type {
  DeductionRule,
  Employee,
  EmployeeCompensation,
  EmployeeLoan,
  PayrollPeriod,
  PayrollSummaryReport,
  Payslip,
  SalaryAdvance,
  SalaryComponent,
} from '../../types/hr'

type Tab = 'periods' | 'payslips' | 'loans' | 'compensation' | 'reports' | 'config'

const periodEmpty = { name: '', period_type: 'monthly', start_date: '', end_date: '', notes: '' }

function periodStatusBadge(status: string) {
  if (status === 'paid' || status === 'closed') return 'success'
  if (status === 'approved' || status === 'reviewed') return 'info'
  if (status === 'generated') return 'warning'
  return 'default'
}

function formatMoney(val: string | number) {
  return Number(val).toLocaleString('en-RW', { style: 'currency', currency: 'RWF', maximumFractionDigits: 0 })
}

export function PayrollPage() {
  const [tab, setTab] = useState<Tab>('periods')
  const [periods, setPeriods] = useState<PayrollPeriod[]>([])
  const [payslips, setPayslips] = useState<Payslip[]>([])
  const [loans, setLoans] = useState<EmployeeLoan[]>([])
  const [advances, setAdvances] = useState<SalaryAdvance[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [compensations, setCompensations] = useState<EmployeeCompensation[]>([])
  const [components, setComponents] = useState<SalaryComponent[]>([])
  const [deductions, setDeductions] = useState<DeductionRule[]>([])
  const [reportPeriod, setReportPeriod] = useState('')
  const [summary, setSummary] = useState<PayrollSummaryReport | null>(null)
  const [reportRows, setReportRows] = useState<Record<string, string>[]>([])
  const [reportType, setReportType] = useState('summary')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState<'period' | 'loan' | 'advance'>('period')
  const [periodForm, setPeriodForm] = useState(periodEmpty)
  const [loanForm, setLoanForm] = useState({ employee: '', principal_amount: '', interest_rate: '0', monthly_deduction: '', start_date: '', notes: '' })
  const [advanceForm, setAdvanceForm] = useState({ employee: '', amount: '', recovery_months: '1', advance_date: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [editComp, setEditComp] = useState<EmployeeCompensation | null>(null)
  const [viewPayslip, setViewPayslip] = useState<Payslip | null>(null)
  const [compForm, setCompForm] = useState({
    basic_salary: '', housing_allowance: '', transport_allowance: '',
    communication_allowance: '', other_allowances: '', effective_from: '', notes: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [periodData, compData, compList, dedList, empData, loanData, advData] = await Promise.all([
        fetchPayrollPeriods(), fetchCompensations(), fetchSalaryComponents(),
        fetchDeductionRules(), fetchEmployees(), fetchLoans(), fetchAdvances(),
      ])
      setPeriods(periodData.results)
      setCompensations(compData.results)
      setComponents(compList)
      setDeductions(dedList)
      setEmployees(empData.results)
      setLoans(loanData.results)
      setAdvances(advData.results)
      if (!reportPeriod && periodData.results[0]) {
        setReportPeriod(periodData.results[0].id)
      }
      if (tab === 'payslips') {
        const ps = await fetchPayslips({ period: reportPeriod || periodData.results[0]?.id })
        setPayslips(ps.results)
      }
    } finally {
      setLoading(false)
    }
  }, [tab, reportPeriod])

  useEffect(() => { load() }, [load])

  const handleGenerate = async (id: string) => {
    if (!confirm('Generate payslips for all active employees?')) return
    try {
      await generatePayroll(id)
      load()
      setTab('payslips')
    } catch {
      alert('Failed to generate payroll. Period must be in draft status.')
    }
  }

  const handleCreatePeriod = async () => {
    setSaving(true)
    try {
      await createPayrollPeriod(periodForm)
      setModalOpen(false)
      setPeriodForm(periodEmpty)
      load()
    } catch { alert('Failed to create payroll period.') }
    finally { setSaving(false) }
  }

  const handleCreateLoan = async () => {
    setSaving(true)
    try {
      await createLoan(loanForm)
      setModalOpen(false)
      load()
    } catch { alert('Failed to create loan.') }
    finally { setSaving(false) }
  }

  const handleCreateAdvance = async () => {
    setSaving(true)
    try {
      await createAdvance({ ...advanceForm, recovery_months: Number(advanceForm.recovery_months) })
      setModalOpen(false)
      load()
    } catch { alert('Failed to create advance.') }
    finally { setSaving(false) }
  }

  const openModal = (type: typeof modalType) => {
    setModalType(type)
    if (type === 'loan') setLoanForm({ ...loanForm, employee: employees[0]?.id ?? '', start_date: new Date().toISOString().slice(0, 10) })
    if (type === 'advance') setAdvanceForm({ ...advanceForm, employee: employees[0]?.id ?? '', advance_date: new Date().toISOString().slice(0, 10) })
    setModalOpen(true)
  }

  const loadReport = async () => {
    if (!reportPeriod) return
    setLoading(true)
    try {
      if (reportType === 'summary') {
        setSummary(await fetchPayrollSummary(reportPeriod))
        setReportRows([])
      } else {
        setSummary(null)
        const fetchers: Record<string, (id: string) => Promise<Record<string, string>[]>> = {
          bank: fetchBankTransferReport,
          tax: fetchTaxReport,
          deductions: fetchDeductionReport,
          allowances: fetchAllowanceReport,
          cost: fetchEmployeeCostReport,
        }
        setReportRows(await (fetchers[reportType]?.(reportPeriod) ?? Promise.resolve([])))
      }
    } finally { setLoading(false) }
  }

  const openPayslip = async (id: string) => {
    setViewPayslip(await fetchPayslip(id))
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'periods', label: 'Periods' },
    { key: 'payslips', label: 'Payslips' },
    { key: 'loans', label: 'Loans & Advances' },
    { key: 'compensation', label: 'Compensation' },
    { key: 'reports', label: 'Reports' },
    { key: 'config', label: 'Config' },
  ]

  return (
    <DashboardLayout title="Payroll">
      <PageHeader
        title="Payroll"
        description="Generate payslips, manage loans, advances, and payroll reports."
        actionLabel={tab === 'periods' ? '+ New Period' : tab === 'loans' ? '+ Add Loan' : undefined}
        onAction={tab === 'periods' ? () => openModal('period') : tab === 'loans' ? () => openModal('loan') : undefined}
      />

      <div className="mb-4 flex gap-2 overflow-x-auto border-b border-slate-200 dark:border-slate-700">
        {tabs.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)}
            className={cn('whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors',
              tab === t.key ? 'border-b-2 border-emerald-600 text-emerald-700 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700')}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'periods' && (
        <DataTable loading={loading} isEmpty={!loading && periods.length === 0} emptyMessage="No payroll periods."
          columns={[{ key: 'name', label: 'Period' }, { key: 'type', label: 'Type' }, { key: 'dates', label: 'Dates' }, { key: 'status', label: 'Status' }, { key: 'actions', label: '', className: 'w-28' }]}>
          {periods.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.name}</TableCell>
              <TableCell className="capitalize">{p.period_type}</TableCell>
              <TableCell>{p.start_date} → {p.end_date}</TableCell>
              <TableCell><Badge variant={periodStatusBadge(p.status)}>{p.status}</Badge></TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {p.status === 'draft' && (
                    <Button variant="ghost" size="sm" title="Generate" onClick={() => handleGenerate(p.id)}>
                      <Play className="h-4 w-4 text-emerald-600" />
                    </Button>
                  )}
                  {p.status !== 'closed' && (
                    <Button variant="ghost" size="sm" title="Advance" onClick={() => advancePayrollPeriod(p.id).then(load)}>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </DataTable>
      )}

      {tab === 'payslips' && (
        <>
          <div className="mb-4">
            <Select label="Payroll Period" options={periods.map((p) => ({ value: p.id, label: p.name }))} value={reportPeriod}
              onChange={async (e) => { setReportPeriod(e.target.value); const ps = await fetchPayslips({ period: e.target.value }); setPayslips(ps.results) }} className="max-w-xs" />
          </div>
          <DataTable loading={loading} isEmpty={!loading && payslips.length === 0} emptyMessage="No payslips. Generate payroll from a draft period."
            columns={[{ key: 'emp', label: 'Employee' }, { key: 'gross', label: 'Gross' }, { key: 'ded', label: 'Deductions' }, { key: 'net', label: 'Net Pay' }, { key: 'actions', label: '', className: 'w-16' }]}>
            {payslips.map((ps) => (
              <TableRow key={ps.id}>
                <TableCell><div><p className="font-medium">{ps.employee_name}</p><p className="text-xs text-slate-500">{ps.employee_number}</p></div></TableCell>
                <TableCell>{formatMoney(ps.gross_pay)}</TableCell>
                <TableCell>{formatMoney(ps.total_deductions)}</TableCell>
                <TableCell className="font-semibold text-emerald-700">{formatMoney(ps.net_pay)}</TableCell>
                <TableCell><Button variant="ghost" size="sm" onClick={() => openPayslip(ps.id)}><FileText className="h-4 w-4" /></Button></TableCell>
              </TableRow>
            ))}
          </DataTable>
        </>
      )}

      {tab === 'loans' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button size="sm" variant="secondary" onClick={() => openModal('advance')}>+ Add Advance</Button>
          </div>
          <DataTable loading={loading} isEmpty={!loading && loans.length === 0} emptyMessage="No employee loans."
            columns={[{ key: 'ref', label: 'Reference' }, { key: 'emp', label: 'Employee' }, { key: 'principal', label: 'Principal' }, { key: 'monthly', label: 'Monthly' }, { key: 'balance', label: 'Balance' }, { key: 'status', label: 'Status' }]}>
            {loans.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="font-mono text-xs">{l.reference}</TableCell>
                <TableCell>{l.employee_name}</TableCell>
                <TableCell>{formatMoney(l.principal_amount)}</TableCell>
                <TableCell>{formatMoney(l.monthly_deduction)}</TableCell>
                <TableCell>{formatMoney(l.balance)}</TableCell>
                <TableCell><Badge variant={l.status === 'active' ? 'warning' : 'success'}>{l.status}</Badge></TableCell>
              </TableRow>
            ))}
          </DataTable>
          <h3 className="font-semibold text-slate-900 dark:text-white">Salary Advances</h3>
          <DataTable loading={loading} isEmpty={!loading && advances.length === 0} emptyMessage="No salary advances."
            columns={[{ key: 'ref', label: 'Reference' }, { key: 'emp', label: 'Employee' }, { key: 'amount', label: 'Amount' }, { key: 'monthly', label: 'Recovery/mo' }, { key: 'balance', label: 'Balance' }, { key: 'status', label: 'Status' }]}>
            {advances.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-mono text-xs">{a.reference}</TableCell>
                <TableCell>{a.employee_name}</TableCell>
                <TableCell>{formatMoney(a.amount)}</TableCell>
                <TableCell>{formatMoney(a.monthly_recovery)}</TableCell>
                <TableCell>{formatMoney(a.balance)}</TableCell>
                <TableCell><Badge variant={a.status === 'active' ? 'warning' : 'success'}>{a.status}</Badge></TableCell>
              </TableRow>
            ))}
          </DataTable>
        </div>
      )}

      {tab === 'compensation' && (
        <DataTable loading={loading} isEmpty={!loading && compensations.length === 0} emptyMessage="No compensation records."
          columns={[{ key: 'employee', label: 'Employee' }, { key: 'basic', label: 'Basic' }, { key: 'gross', label: 'Gross' }, { key: 'actions', label: '', className: 'w-20' }]}>
          {compensations.map((c) => (
            <TableRow key={c.id}>
              <TableCell><div><p className="font-medium">{c.employee_name}</p><p className="text-xs text-slate-500">{c.employee_number}</p></div></TableCell>
              <TableCell>{formatMoney(c.basic_salary)}</TableCell>
              <TableCell className="font-semibold text-emerald-700">{formatMoney(c.gross_salary)}</TableCell>
              <TableCell><Button variant="ghost" size="sm" onClick={() => { setEditComp(c); setCompForm({ basic_salary: c.basic_salary, housing_allowance: c.housing_allowance, transport_allowance: c.transport_allowance, communication_allowance: c.communication_allowance, other_allowances: c.other_allowances, effective_from: c.effective_from ?? '', notes: c.notes ?? '' }) }}>Edit</Button></TableCell>
            </TableRow>
          ))}
        </DataTable>
      )}

      {tab === 'reports' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Select options={periods.map((p) => ({ value: p.id, label: p.name }))} value={reportPeriod} onChange={(e) => setReportPeriod(e.target.value)} className="w-48" />
            <Select options={[
              { value: 'summary', label: 'Payroll Summary' }, { value: 'bank', label: 'Bank Transfer' },
              { value: 'tax', label: 'Tax Report' }, { value: 'deductions', label: 'Deductions' },
              { value: 'allowances', label: 'Allowances' }, { value: 'cost', label: 'Employee Cost' },
            ]} value={reportType} onChange={(e) => setReportType(e.target.value)} className="w-48" />
            <Button onClick={loadReport}>Run Report</Button>
          </div>
          {summary && (
            <Card className="p-4">
              <h3 className="mb-3 font-semibold">{summary.period} — Summary</h3>
              <div className="grid gap-3 sm:grid-cols-4">
                <div><p className="text-xs text-slate-500">Employees</p><p className="text-lg font-bold">{summary.employee_count}</p></div>
                <div><p className="text-xs text-slate-500">Gross</p><p className="text-lg font-bold">{formatMoney(summary.total_gross)}</p></div>
                <div><p className="text-xs text-slate-500">Deductions</p><p className="text-lg font-bold">{formatMoney(summary.total_deductions)}</p></div>
                <div><p className="text-xs text-slate-500">Net Pay</p><p className="text-lg font-bold text-emerald-700">{formatMoney(summary.total_net)}</p></div>
              </div>
            </Card>
          )}
          {reportRows.length > 0 && (
            <DataTable loading={false} isEmpty={false} columns={Object.keys(reportRows[0]).map((k) => ({ key: k, label: k.replace(/_/g, ' ') }))}>
              {reportRows.map((row, i) => (
                <TableRow key={i}>{Object.values(row).map((v, j) => <TableCell key={j}>{String(v)}</TableCell>)}</TableRow>
              ))}
            </DataTable>
          )}
        </div>
      )}

      {tab === 'config' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-4"><h3 className="mb-3 font-semibold">Salary Components</h3>
            <ul className="space-y-2">{components.map((c) => (
              <li key={c.id} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/60">
                <span>{c.name}</span><Badge variant={c.component_type === 'earning' ? 'success' : 'danger'}>{c.component_type}</Badge>
              </li>))}</ul></Card>
          <Card className="p-4"><h3 className="mb-3 font-semibold">Deduction Rules</h3>
            <ul className="space-y-2">{deductions.map((d) => (
              <li key={d.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/60">
                <div className="flex justify-between"><span className="font-medium">{d.name}</span>{d.is_statutory && <Badge variant="info">Statutory</Badge>}</div>
                <p className="text-xs text-slate-500">{d.calculation_type === 'percentage' ? `${d.value}% of basic` : formatMoney(d.value)}</p>
              </li>))}</ul></Card>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={modalType === 'period' ? 'New Payroll Period' : modalType === 'loan' ? 'New Employee Loan' : 'New Salary Advance'}>
        {modalType === 'period' && (
          <div className="grid gap-4">
            <Input label="Name" value={periodForm.name} onChange={(e) => setPeriodForm({ ...periodForm, name: e.target.value })} />
            <Select label="Type" options={[{ value: 'monthly', label: 'Monthly' }, { value: 'weekly', label: 'Weekly' }]} value={periodForm.period_type} onChange={(e) => setPeriodForm({ ...periodForm, period_type: e.target.value })} />
            <Input label="Start" type="date" value={periodForm.start_date} onChange={(e) => setPeriodForm({ ...periodForm, start_date: e.target.value })} />
            <Input label="End" type="date" value={periodForm.end_date} onChange={(e) => setPeriodForm({ ...periodForm, end_date: e.target.value })} />
          </div>
        )}
        {modalType === 'loan' && (
          <div className="grid gap-4">
            <Select label="Employee" options={employees.map((e) => ({ value: e.id, label: e.full_name }))} value={loanForm.employee} onChange={(e) => setLoanForm({ ...loanForm, employee: e.target.value })} />
            <Input label="Principal" type="number" value={loanForm.principal_amount} onChange={(e) => setLoanForm({ ...loanForm, principal_amount: e.target.value })} />
            <Input label="Monthly Deduction" type="number" value={loanForm.monthly_deduction} onChange={(e) => setLoanForm({ ...loanForm, monthly_deduction: e.target.value })} />
            <Input label="Start Date" type="date" value={loanForm.start_date} onChange={(e) => setLoanForm({ ...loanForm, start_date: e.target.value })} />
          </div>
        )}
        {modalType === 'advance' && (
          <div className="grid gap-4">
            <Select label="Employee" options={employees.map((e) => ({ value: e.id, label: e.full_name }))} value={advanceForm.employee} onChange={(e) => setAdvanceForm({ ...advanceForm, employee: e.target.value })} />
            <Input label="Amount" type="number" value={advanceForm.amount} onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })} />
            <Input label="Recovery Months" type="number" value={advanceForm.recovery_months} onChange={(e) => setAdvanceForm({ ...advanceForm, recovery_months: e.target.value })} />
            <Input label="Date" type="date" value={advanceForm.advance_date} onChange={(e) => setAdvanceForm({ ...advanceForm, advance_date: e.target.value })} />
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button disabled={saving} onClick={modalType === 'period' ? handleCreatePeriod : modalType === 'loan' ? handleCreateLoan : handleCreateAdvance}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </Modal>

      <Modal open={!!editComp} onClose={() => setEditComp(null)} title="Edit Compensation" size="lg">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Basic Salary" type="number" value={compForm.basic_salary} onChange={(e) => setCompForm({ ...compForm, basic_salary: e.target.value })} />
          <Input label="Housing" type="number" value={compForm.housing_allowance} onChange={(e) => setCompForm({ ...compForm, housing_allowance: e.target.value })} />
          <Input label="Transport" type="number" value={compForm.transport_allowance} onChange={(e) => setCompForm({ ...compForm, transport_allowance: e.target.value })} />
          <Input label="Communication" type="number" value={compForm.communication_allowance} onChange={(e) => setCompForm({ ...compForm, communication_allowance: e.target.value })} />
          <Input label="Other" type="number" value={compForm.other_allowances} onChange={(e) => setCompForm({ ...compForm, other_allowances: e.target.value })} />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setEditComp(null)}>Cancel</Button>
          <Button disabled={saving} onClick={async () => { if (!editComp) return; setSaving(true); await updateCompensation(editComp.employee, { ...compForm, effective_from: compForm.effective_from || null }); setEditComp(null); load(); setSaving(false) }}>Save</Button>
        </div>
      </Modal>

      <Modal open={!!viewPayslip} onClose={() => setViewPayslip(null)} title={`Payslip — ${viewPayslip?.employee_name}`} size="lg">
        {viewPayslip && (
          <div>
            <div className="mb-4 grid grid-cols-3 gap-3 text-sm">
              <div><p className="text-slate-500">Gross</p><p className="font-bold">{formatMoney(viewPayslip.gross_pay)}</p></div>
              <div><p className="text-slate-500">Deductions</p><p className="font-bold">{formatMoney(viewPayslip.total_deductions)}</p></div>
              <div><p className="text-slate-500">Net Pay</p><p className="font-bold text-emerald-700">{formatMoney(viewPayslip.net_pay)}</p></div>
            </div>
            <h4 className="mb-2 font-medium">Earnings</h4>
            <ul className="mb-4 space-y-1">{viewPayslip.lines?.filter((l) => l.line_type === 'earning').map((l) => (
              <li key={l.id} className="flex justify-between text-sm"><span>{l.description}</span><span>{formatMoney(l.amount)}</span></li>))}</ul>
            <h4 className="mb-2 font-medium">Deductions</h4>
            <ul className="space-y-1">{viewPayslip.lines?.filter((l) => l.line_type === 'deduction').map((l) => (
              <li key={l.id} className="flex justify-between text-sm"><span>{l.description}</span><span className="text-red-600">-{formatMoney(l.amount)}</span></li>))}</ul>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  )
}
