import { CheckCircle, Eye, PackageCheck, Plus, Search, XCircle } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  approvePurchase,
  cancelPurchase,
  createPurchase,
  fetchProducts,
  fetchPurchase,
  fetchPurchases,
  fetchSuppliers,
  receivePurchase,
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
import type { Product, Purchase, PurchaseListItem, Supplier } from '../../types/inventory'

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'info' | 'danger'> = {
  draft: 'default',
  approved: 'info',
  partially_received: 'warning',
  received: 'success',
  cancelled: 'danger',
}

interface LineItem {
  product: string
  quantity: string
  unit_price: string
  discount: string
  tax: string
}

const emptyLine = (): LineItem => ({
  product: '',
  quantity: '1',
  unit_price: '0',
  discount: '0',
  tax: '0',
})

function purchaseStatusVariant(status: string) {
  return STATUS_VARIANT[status] ?? 'default'
}

export function PurchasesPage() {
  const { hasPermission } = useAuth()
  const canCreate = hasPermission('inventory.purchases.create')
  const canDelete = hasPermission('inventory.purchases.delete')
  const canApprove = hasPermission('inventory.purchases.approve')
  const [purchases, setPurchases] = useState<PurchaseListItem[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [receiveOpen, setReceiveOpen] = useState(false)
  const [selected, setSelected] = useState<Purchase | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    supplier: '',
    invoice_number: '',
    purchase_date: new Date().toISOString().slice(0, 10),
    expected_delivery: '',
    remarks: '',
  })
  const [lines, setLines] = useState<LineItem[]>([emptyLine()])
  const [receiveLines, setReceiveLines] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchPurchases({ search: search || undefined, status: statusFilter || undefined })
      setPurchases(data.results)
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => {
    load()
  }, [load])

  const loadMasters = async () => {
    const [sup, prods] = await Promise.all([fetchSuppliers(), fetchProducts()])
    setSuppliers(sup.results)
    setProducts(prods.results)
    setForm((f) => ({ ...f, supplier: sup.results[0]?.id ?? '' }))
  }

  const openCreate = async () => {
    await loadMasters()
    setLines([emptyLine()])
    setError('')
    setCreateOpen(true)
  }

  const openDetail = async (id: string) => {
    const purchase = await fetchPurchase(id)
    setSelected(purchase)
    setDetailOpen(true)
  }

  const openReceive = async (id: string) => {
    const purchase = await fetchPurchase(id)
    setSelected(purchase)
    const init: Record<string, string> = {}
    purchase.items.forEach((item) => {
      if (Number(item.pending_quantity) > 0) {
        init[item.id] = String(item.pending_quantity)
      }
    })
    setReceiveLines(init)
    setReceiveOpen(true)
  }

  const handleCreate = async () => {
    setSaving(true)
    setError('')
    try {
      await createPurchase({
        ...form,
        expected_delivery: form.expected_delivery || null,
        items: lines.filter((l) => l.product),
      })
      setCreateOpen(false)
      load()
    } catch {
      setError('Failed to create purchase. Check all fields.')
    } finally {
      setSaving(false)
    }
  }

  const handleApprove = async (id: string) => {
    await approvePurchase(id)
    load()
    if (selected?.id === id) setSelected(await fetchPurchase(id))
  }

  const handleReceive = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const linesPayload = Object.entries(receiveLines)
        .filter(([, qty]) => Number(qty) > 0)
        .map(([purchase_item_id, received_quantity]) => ({
          purchase_item_id,
          received_quantity,
          rejected_quantity: '0',
        }))
      await receivePurchase(selected.id, { lines: linesPayload })
      setReceiveOpen(false)
      load()
    } catch {
      setError('Failed to receive goods.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this purchase?')) return
    await cancelPurchase(id)
    load()
    setDetailOpen(false)
  }

  const updateLine = (idx: number, key: keyof LineItem, value: string) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, [key]: value } : l)))
  }

  return (
    <DashboardLayout title="Purchases">
      <PageHeader
        title="Purchases"
        description="Create purchase orders, approve, and receive goods into stock."
        actionLabel={canCreate ? '+ New Purchase' : undefined}
        onAction={canCreate ? openCreate : undefined}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search PO number, invoice, supplier..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select
          options={[
            { value: '', label: 'All statuses' },
            { value: 'draft', label: 'Draft' },
            { value: 'approved', label: 'Approved' },
            { value: 'partially_received', label: 'Partially Received' },
            { value: 'received', label: 'Received' },
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="sm:w-48"
        />
      </div>

      <DataTable
        loading={loading}
        isEmpty={!loading && purchases.length === 0}
        columns={[
          { key: 'po', label: 'PO Number' },
          { key: 'supplier', label: 'Supplier' },
          { key: 'date', label: 'Date' },
          { key: 'total', label: 'Total' },
          { key: 'status', label: 'Status' },
          { key: 'actions', label: '', className: 'w-36' },
        ]}
      >
        {purchases.map((p) => (
          <TableRow key={p.id}>
            <TableCell className="font-mono text-xs font-medium">{p.purchase_number}</TableCell>
            <TableCell>{p.supplier_name}</TableCell>
            <TableCell>{p.purchase_date}</TableCell>
            <TableCell className="font-medium">RWF {Number(p.total_amount).toLocaleString()}</TableCell>
            <TableCell>
              <Badge variant={purchaseStatusVariant(p.status)}>{p.status_display}</Badge>
            </TableCell>
            <TableCell>
              <div className="flex gap-1">
                <button type="button" onClick={() => openDetail(p.id)} className="rounded-lg p-1.5 text-slate-400 hover:text-emerald-600" title="View">
                  <Eye className="h-4 w-4" />
                </button>
                {canApprove && p.status === 'draft' && (
                  <button type="button" onClick={() => handleApprove(p.id)} className="rounded-lg p-1.5 text-slate-400 hover:text-blue-600" title="Approve">
                    <CheckCircle className="h-4 w-4" />
                  </button>
                )}
                {canApprove && (p.status === 'approved' || p.status === 'partially_received') && (
                  <button type="button" onClick={() => openReceive(p.id)} className="rounded-lg p-1.5 text-slate-400 hover:text-emerald-600" title="Receive">
                    <PackageCheck className="h-4 w-4" />
                  </button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </DataTable>

      {/* Create Purchase Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Purchase Order" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Supplier *"
              options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
              value={form.supplier}
              onChange={(e) => setForm({ ...form, supplier: e.target.value })}
            />
            <Input label="Invoice Number" value={form.invoice_number} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} />
            <Input label="Purchase Date *" type="date" value={form.purchase_date} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} />
            <Input label="Expected Delivery" type="date" value={form.expected_delivery} onChange={(e) => setForm({ ...form, expected_delivery: e.target.value })} />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Line Items</p>
              <Button variant="ghost" size="sm" onClick={() => setLines((l) => [...l, emptyLine()])}>
                <Plus className="h-3 w-3" /> Add line
              </Button>
            </div>
            <div className="space-y-2">
              {lines.map((line, idx) => (
                <div key={idx} className="grid grid-cols-2 gap-2 rounded-lg border border-slate-100 p-3 sm:grid-cols-5 dark:border-slate-800">
                  <Select
                    options={products.map((p) => ({ value: p.id, label: `${p.code} — ${p.name}` }))}
                    value={line.product}
                    onChange={(e) => updateLine(idx, 'product', e.target.value)}
                    placeholder="Product"
                  />
                  <Input type="number" placeholder="Qty" value={line.quantity} onChange={(e) => updateLine(idx, 'quantity', e.target.value)} />
                  <Input type="number" placeholder="Unit price" value={line.unit_price} onChange={(e) => updateLine(idx, 'unit_price', e.target.value)} />
                  <Input type="number" placeholder="Discount" value={line.discount} onChange={(e) => updateLine(idx, 'discount', e.target.value)} />
                  <Input type="number" placeholder="Tax" value={line.tax} onChange={(e) => updateLine(idx, 'tax', e.target.value)} />
                </div>
              ))}
            </div>
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={saving}>{saving ? 'Saving...' : 'Create PO'}</Button>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title={selected?.purchase_number ?? 'Purchase'} size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant={purchaseStatusVariant(selected.status)}>{selected.status_display}</Badge>
              <span className="text-sm text-slate-500">{selected.supplier_name}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-slate-500">Date:</span> {selected.purchase_date}</div>
              <div><span className="text-slate-500">Invoice:</span> {selected.invoice_number || '—'}</div>
              <div><span className="text-slate-500">Total:</span> RWF {Number(selected.total_amount).toLocaleString()}</div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs text-slate-500 dark:border-slate-800">
                  <th className="pb-2">Product</th>
                  <th className="pb-2">Qty</th>
                  <th className="pb-2">Received</th>
                  <th className="pb-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {selected.items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-50 dark:border-slate-800">
                    <td className="py-2">{item.product_name}</td>
                    <td className="py-2">{item.quantity}</td>
                    <td className="py-2">{item.received_quantity} / {item.quantity}</td>
                    <td className="py-2">RWF {Number(item.total).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex gap-2">
              {selected.status === 'draft' && (
                <>
                  {canApprove && (
                  <Button size="sm" onClick={() => handleApprove(selected.id)}>Approve</Button>
                  )}
                  {canDelete && (
                  <Button variant="danger" size="sm" onClick={() => handleCancel(selected.id)}>
                    <XCircle className="h-4 w-4" /> Cancel
                  </Button>
                  )}
                </>
              )}
              {canApprove && (selected.status === 'approved' || selected.status === 'partially_received') && (
                <Button size="sm" onClick={() => { setDetailOpen(false); openReceive(selected.id) }}>
                  <PackageCheck className="h-4 w-4" /> Receive Goods
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Receive Modal */}
      <Modal open={receiveOpen} onClose={() => setReceiveOpen(false)} title="Receive Goods" size="md">
        {selected && (
          <div className="space-y-3">
            <p className="text-sm text-slate-500">Enter received quantities for {selected.purchase_number}</p>
            {selected.items.filter((i) => Number(i.pending_quantity) > 0).map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 rounded-lg border border-slate-100 p-3 dark:border-slate-800">
                <div>
                  <p className="text-sm font-medium">{item.product_name}</p>
                  <p className="text-xs text-slate-400">Pending: {item.pending_quantity} {item.unit_symbol}</p>
                </div>
                <Input
                  type="number"
                  className="w-24"
                  value={receiveLines[item.id] ?? ''}
                  onChange={(e) => setReceiveLines({ ...receiveLines, [item.id]: e.target.value })}
                />
              </div>
            ))}
          </div>
        )}
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setReceiveOpen(false)}>Cancel</Button>
          <Button onClick={handleReceive} disabled={saving}>
            <PackageCheck className="h-4 w-4" />
            {saving ? 'Receiving...' : 'Confirm Receipt'}
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
