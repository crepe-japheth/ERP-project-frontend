import { FileText } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { fetchPayrollPeriods, fetchPayslip, fetchPayslips } from '../../api/hr'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Button } from '../../components/ui/Button'
import { DataTable, TableCell, TableRow } from '../../components/ui/DataTable'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { Select } from '../../components/ui/Select'
import type { PayrollPeriod, Payslip } from '../../types/hr'

function money(v: string | number) {
  return Number(v).toLocaleString('en-RW', { style: 'currency', currency: 'RWF', maximumFractionDigits: 0 })
}

export function PayslipsPage() {
  const [periods, setPeriods] = useState<PayrollPeriod[]>([])
  const [payslips, setPayslips] = useState<Payslip[]>([])
  const [periodId, setPeriodId] = useState('')
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<Payslip | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const p = await fetchPayrollPeriods()
      setPeriods(p.results)
      const selected = periodId || p.results[0]?.id || ''
      if (!periodId && selected) setPeriodId(selected)
      if (selected) {
        const ps = await fetchPayslips({ period: selected })
        setPayslips(ps.results)
      } else setPayslips([])
    } finally { setLoading(false) }
  }, [periodId])

  useEffect(() => { load() }, [load])

  return (
    <DashboardLayout title="Payslips">
      <PageHeader title="Payslips" description="Employee payslips generated from payroll." />
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
