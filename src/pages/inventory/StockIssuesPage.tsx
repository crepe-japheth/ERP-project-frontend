import { CheckCircle, Eye, Package, Plus, Search, Truck } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  approveIssue,
  createIssue,
  executeIssue,
  fetchIssue,
  fetchIssues,
  fetchProducts,
  returnIssueItem,
} from '../../api/inventory'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { DataTable, TableCell, TableRow } from '../../components/ui/DataTable'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { Select } from '../../components/ui/Select'
import { useAuth } from '../../context/AuthContext'
import type { Product, StockIssue, StockIssueListItem } from '../../types/inventory'

const ISSUE_TYPES = [
  { value: 'consumable', label: 'Consumable' },
  { value: 'returnable', label: 'Returnable' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'damage', label: 'Damage' },
  { value: 'loss', label: 'Loss' },
]

const RETURN_CONDITIONS = [
  { value: 'good', label: 'Good' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'needs_repair', label: 'Needs Repair' },
  { value: 'broken', label: 'Broken' },
]

interface IssueLine {
  product: string
  quantity: string
  issue_type: string
  expected_return_date: string
}

const emptyLine = (): IssueLine => ({
  product: '',
  quantity: '1',
  issue_type: 'consumable',
  expected_return_date: '',
})

function statusVariant(status: string) {
  const map: Record<string, 'default' | 'success' | 'warning' | 'info' | 'danger'> = {
    draft: 'default',
    approved: 'info',
    issued: 'success',
    partially_returned: 'warning',
    closed: 'success',
    cancelled: 'danger',
  }
  return map[status] ?? 'default'
}

export function StockIssuesPage() {
  const { hasPermission } = useAuth()
  const canCreate = hasPermission('inventory.stock.create')
  const canApprove = hasPermission('inventory.stock.approve')
  const [issues, setIssues] = useState<StockIssueListItem[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [returnOpen, setReturnOpen] = useState(false)
  const [selected, setSelected] = useState<StockIssue | null>(null)
  const [returnItemId, setReturnItemId] = useState('')
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    issue_date: new Date().toISOString().slice(0, 10),
    department: '',
    employee_name: '',
    project: '',
    purpose: '',
  })
  const [lines, setLines] = useState<IssueLine[]>([emptyLine()])
  const [returnForm, setReturnForm] = useState({
    return_date: new Date().toISOString().slice(0, 10),
    returned_quantity: '',
    condition: 'good',
    remarks: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchIssues({ search: search || undefined })
      setIssues(data.results)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = async () => {
    const prods = await fetchProducts()
    setProducts(prods.results)
    setLines([emptyLine()])
    setCreateOpen(true)
  }

  const openDetail = async (id: string) => {
    setSelected(await fetchIssue(id))
    setDetailOpen(true)
  }

  const handleCreate = async () => {
    setSaving(true)
    try {
      await createIssue({
        ...form,
        items: lines.filter((l) => l.product).map((l) => ({
          ...l,
          expected_return_date: l.expected_return_date || null,
        })),
      })
      setCreateOpen(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  const handleApprove = async (id: string) => {
    await approveIssue(id)
    load()
    if (selected?.id === id) setSelected(await fetchIssue(id))
  }

  const handleIssue = async (id: string) => {
    await executeIssue(id)
    load()
    if (selected?.id === id) setSelected(await fetchIssue(id))
  }

  const openReturn = (itemId: string) => {
    setReturnItemId(itemId)
    setReturnForm({ return_date: new Date().toISOString().slice(0, 10), returned_quantity: '', condition: 'good', remarks: '' })
    setReturnOpen(true)
  }

  const handleReturn = async () => {
    setSaving(true)
    try {
      await returnIssueItem(returnItemId, returnForm)
      setReturnOpen(false)
      if (selected) setSelected(await fetchIssue(selected.id))
      load()
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout title="Stock Issues">
      <PageHeader
        title="Stock Issues"
        description="Issue stock to departments and employees. Track returns for returnable items."
        actionLabel={canCreate ? '+ New Issue' : undefined}
        onAction={canCreate ? openCreate : undefined}
      />

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input placeholder="Search issues..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <DataTable
        loading={loading}
        isEmpty={!loading && issues.length === 0}
        columns={[
          { key: 'num', label: 'Issue #' },
          { key: 'date', label: 'Date' },
          { key: 'dept', label: 'Department' },
          { key: 'employee', label: 'Employee' },
          { key: 'status', label: 'Status' },
          { key: 'actions', label: '', className: 'w-32' },
        ]}
      >
        {issues.map((issue) => (
          <TableRow key={issue.id}>
            <TableCell className="font-mono text-xs">{issue.issue_number}</TableCell>
            <TableCell>{issue.issue_date}</TableCell>
            <TableCell>{issue.department || '—'}</TableCell>
            <TableCell>{issue.employee_name || '—'}</TableCell>
            <TableCell><Badge variant={statusVariant(issue.status)}>{issue.status_display}</Badge></TableCell>
            <TableCell>
              <div className="flex gap-1">
                <button type="button" onClick={() => openDetail(issue.id)} className="rounded-lg p-1.5 text-slate-400 hover:text-emerald-600">
                  <Eye className="h-4 w-4" />
                </button>
                {canApprove && issue.status === 'draft' && (
                  <button type="button" onClick={() => handleApprove(issue.id)} className="rounded-lg p-1.5 text-slate-400 hover:text-blue-600">
                    <CheckCircle className="h-4 w-4" />
                  </button>
                )}
                {canApprove && issue.status === 'approved' && (
                  <button type="button" onClick={() => handleIssue(issue.id)} className="rounded-lg p-1.5 text-slate-400 hover:text-emerald-600">
                    <Truck className="h-4 w-4" />
                  </button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </DataTable>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Stock Issue" size="lg">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Issue Date" type="date" value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} />
          <Input label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          <Input label="Employee Name" value={form.employee_name} onChange={(e) => setForm({ ...form, employee_name: e.target.value })} />
          <Input label="Project" value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })} />
          <div className="sm:col-span-2">
            <Input label="Purpose" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
          </div>
        </div>
        <div className="mt-4">
          <div className="mb-2 flex justify-between">
            <p className="text-sm font-medium">Items</p>
            <Button variant="ghost" size="sm" onClick={() => setLines((l) => [...l, emptyLine()])}><Plus className="h-3 w-3" /> Add</Button>
          </div>
          {lines.map((line, idx) => (
            <div key={idx} className="mb-2 grid grid-cols-2 gap-2 rounded-lg border border-slate-100 p-3 sm:grid-cols-4 dark:border-slate-800">
              <Select options={products.map((p) => ({ value: p.id, label: p.name }))} value={line.product} onChange={(e) => setLines(lines.map((l, i) => i === idx ? { ...l, product: e.target.value } : l))} placeholder="Product" />
              <Input type="number" placeholder="Qty" value={line.quantity} onChange={(e) => setLines(lines.map((l, i) => i === idx ? { ...l, quantity: e.target.value } : l))} />
              <Select options={ISSUE_TYPES} value={line.issue_type} onChange={(e) => setLines(lines.map((l, i) => i === idx ? { ...l, issue_type: e.target.value } : l))} />
              {line.issue_type === 'returnable' && (
                <Input type="date" placeholder="Return by" value={line.expected_return_date} onChange={(e) => setLines(lines.map((l, i) => i === idx ? { ...l, expected_return_date: e.target.value } : l))} />
              )}
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={saving}>{saving ? 'Saving...' : 'Create Issue'}</Button>
        </div>
      </Modal>

      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title={selected?.issue_number ?? 'Issue'} size="lg">
        {selected && (
          <div className="space-y-4">
            <Badge variant={statusVariant(selected.status)}>{selected.status_display}</Badge>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-slate-500">Department:</span> {selected.department || '—'}</div>
              <div><span className="text-slate-500">Employee:</span> {selected.employee_name || '—'}</div>
              <div className="col-span-2"><span className="text-slate-500">Purpose:</span> {selected.purpose || '—'}</div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-slate-500">
                  <th className="pb-2">Product</th>
                  <th className="pb-2">Qty</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Outstanding</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {selected.items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-50 dark:border-slate-800">
                    <td className="py-2">{item.product_name}</td>
                    <td className="py-2">{item.quantity}</td>
                    <td className="py-2"><Badge variant="info">{item.issue_type_display}</Badge></td>
                    <td className="py-2">{item.outstanding_quantity}</td>
                    <td className="py-2">
                      {canCreate && selected.status === 'issued' && Number(item.outstanding_quantity) > 0 && item.issue_type === 'returnable' && (
                        <Button variant="ghost" size="sm" onClick={() => openReturn(item.id)}>
                          <Package className="h-3 w-3" /> Return
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex gap-2">
              {canApprove && selected.status === 'draft' && <Button size="sm" onClick={() => handleApprove(selected.id)}>Approve</Button>}
              {canApprove && selected.status === 'approved' && <Button size="sm" onClick={() => handleIssue(selected.id)}><Truck className="h-4 w-4" /> Issue Stock</Button>}
            </div>
          </div>
        )}
      </Modal>

      <Modal open={returnOpen} onClose={() => setReturnOpen(false)} title="Record Return">
        <div className="space-y-4">
          <Input label="Return Date" type="date" value={returnForm.return_date} onChange={(e) => setReturnForm({ ...returnForm, return_date: e.target.value })} />
          <Input label="Returned Quantity" type="number" value={returnForm.returned_quantity} onChange={(e) => setReturnForm({ ...returnForm, returned_quantity: e.target.value })} />
          <Select label="Condition" options={RETURN_CONDITIONS} value={returnForm.condition} onChange={(e) => setReturnForm({ ...returnForm, condition: e.target.value })} />
          <Input label="Remarks" value={returnForm.remarks} onChange={(e) => setReturnForm({ ...returnForm, remarks: e.target.value })} />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setReturnOpen(false)}>Cancel</Button>
          <Button onClick={handleReturn} disabled={saving}>Confirm Return</Button>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
