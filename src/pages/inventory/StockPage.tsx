import { AlertTriangle, History, Search, SlidersHorizontal } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  createAdjustment,
  fetchAdjustments,
  fetchMovements,
  fetchProducts,
  fetchStock,
} from '../../api/inventory'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { DataTable, TableCell, TableRow } from '../../components/ui/DataTable'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { Select } from '../../components/ui/Select'
import type { Product, StockAdjustment, StockLevel, StockMovement } from '../../types/inventory'
import { cn } from '../../lib/cn'

type Tab = 'levels' | 'movements' | 'adjustments'

const ADJUSTMENT_REASONS = [
  { value: 'damage', label: 'Damage' },
  { value: 'expired', label: 'Expired' },
  { value: 'missing', label: 'Missing' },
  { value: 'found', label: 'Found' },
  { value: 'inventory_count', label: 'Inventory Count' },
  { value: 'data_correction', label: 'Data Correction' },
]

const MOVEMENT_TYPES = [
  { value: '', label: 'All types' },
  { value: 'purchase', label: 'Purchase' },
  { value: 'issue', label: 'Issue' },
  { value: 'return', label: 'Return' },
  { value: 'adjustment', label: 'Adjustment' },
  { value: 'consumption', label: 'Consumption' },
  { value: 'loss', label: 'Loss' },
]

export function StockPage() {
  const [tab, setTab] = useState<Tab>('levels')
  const [stock, setStock] = useState<StockLevel[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [movementType, setMovementType] = useState('')
  const [adjOpen, setAdjOpen] = useState(false)
  const [adjForm, setAdjForm] = useState({ product: '', quantity_change: '', reason: 'inventory_count', remarks: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (tab === 'levels') {
        const data = await fetchStock({ search: search || undefined, low_stock: lowStockOnly })
        setStock(data.results)
      } else if (tab === 'movements') {
        const data = await fetchMovements({ search: search || undefined, movement_type: movementType || undefined })
        setMovements(data.results)
      } else {
        const data = await fetchAdjustments({ search: search || undefined })
        setAdjustments(data.results)
      }
    } finally {
      setLoading(false)
    }
  }, [tab, search, lowStockOnly, movementType])

  useEffect(() => {
    load()
  }, [load])

  const openAdjustment = async () => {
    const prods = await fetchProducts()
    setProducts(prods.results)
    setAdjForm({ product: prods.results[0]?.id ?? '', quantity_change: '', reason: 'inventory_count', remarks: '' })
    setAdjOpen(true)
  }

  const handleAdjustment = async () => {
    setSaving(true)
    try {
      await createAdjustment(adjForm)
      setAdjOpen(false)
      setTab('adjustments')
      load()
    } finally {
      setSaving(false)
    }
  }

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'levels', label: 'Current Stock', icon: AlertTriangle },
    { id: 'movements', label: 'Movement History', icon: History },
    { id: 'adjustments', label: 'Adjustments', icon: SlidersHorizontal },
  ]

  return (
    <DashboardLayout title="Stock">
      <PageHeader title="Stock Management" description="Monitor stock levels, movement history, and adjustments.">
        {tab === 'levels' && (
          <Button variant={lowStockOnly ? 'primary' : 'secondary'} size="sm" onClick={() => setLowStockOnly((v) => !v)}>
            <AlertTriangle className="h-4 w-4" /> Low Stock
          </Button>
        )}
        {tab === 'adjustments' && (
          <Button size="sm" onClick={openAdjustment}>+ Adjustment</Button>
        )}
      </PageHeader>

      <div className="mb-4 flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              tab === t.id
                ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-800 dark:text-emerald-400'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300',
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        {tab === 'movements' && (
          <Select options={MOVEMENT_TYPES} value={movementType} onChange={(e) => setMovementType(e.target.value)} className="sm:w-48" />
        )}
      </div>

      {tab === 'levels' && (
        <DataTable
          loading={loading}
          isEmpty={!loading && stock.length === 0}
          columns={[
            { key: 'product', label: 'Product' },
            { key: 'warehouse', label: 'Warehouse' },
            { key: 'qty', label: 'Quantity' },
            { key: 'available', label: 'Available' },
            { key: 'cost', label: 'Avg Cost' },
            { key: 'alert', label: 'Status' },
          ]}
        >
          {stock.map((s) => (
            <TableRow key={s.id} className={cn(s.is_low_stock && 'bg-red-50/50 dark:bg-red-950/10')}>
              <TableCell>
                <p className="font-medium text-slate-900 dark:text-white">{s.product_name}</p>
                <p className="text-xs text-slate-400">{s.product_code}</p>
              </TableCell>
              <TableCell>{s.warehouse_name}</TableCell>
              <TableCell>{s.quantity} {s.unit_symbol}</TableCell>
              <TableCell>{s.available_quantity}</TableCell>
              <TableCell>RWF {Number(s.average_cost).toLocaleString()}</TableCell>
              <TableCell>
                {s.is_low_stock ? <Badge variant="danger">Low Stock</Badge> : <Badge variant="success">OK</Badge>}
              </TableCell>
            </TableRow>
          ))}
        </DataTable>
      )}

      {tab === 'movements' && (
        <DataTable
          loading={loading}
          isEmpty={!loading && movements.length === 0}
          emptyMessage="No stock movements yet."
          columns={[
            { key: 'date', label: 'Date' },
            { key: 'product', label: 'Product' },
            { key: 'type', label: 'Type' },
            { key: 'qty', label: 'Qty Change' },
            { key: 'balance', label: 'Balance' },
            { key: 'by', label: 'By' },
          ]}
        >
          {movements.map((m) => (
            <TableRow key={m.id}>
              <TableCell className="text-xs text-slate-500">{new Date(m.created_at).toLocaleString()}</TableCell>
              <TableCell>{m.product_name}</TableCell>
              <TableCell><Badge variant="info">{m.movement_type_display}</Badge></TableCell>
              <TableCell className={cn(Number(m.quantity) >= 0 ? 'text-emerald-600' : 'text-red-600', 'font-medium')}>
                {Number(m.quantity) >= 0 ? '+' : ''}{m.quantity}
              </TableCell>
              <TableCell>{m.balance_after}</TableCell>
              <TableCell className="text-xs">{m.created_by_name ?? '—'}</TableCell>
            </TableRow>
          ))}
        </DataTable>
      )}

      {tab === 'adjustments' && (
        <DataTable
          loading={loading}
          isEmpty={!loading && adjustments.length === 0}
          columns={[
            { key: 'num', label: 'Number' },
            { key: 'product', label: 'Product' },
            { key: 'change', label: 'Change' },
            { key: 'reason', label: 'Reason' },
            { key: 'by', label: 'By' },
            { key: 'date', label: 'Date' },
          ]}
        >
          {adjustments.map((a) => (
            <TableRow key={a.id}>
              <TableCell className="font-mono text-xs">{a.adjustment_number}</TableCell>
              <TableCell>{a.product_name}</TableCell>
              <TableCell className={cn(Number(a.quantity_change) >= 0 ? 'text-emerald-600' : 'text-red-600', 'font-medium')}>
                {Number(a.quantity_change) >= 0 ? '+' : ''}{a.quantity_change}
              </TableCell>
              <TableCell>{a.reason_display}</TableCell>
              <TableCell className="text-xs">{a.adjusted_by_name ?? '—'}</TableCell>
              <TableCell className="text-xs text-slate-500">{new Date(a.created_at).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </DataTable>
      )}

      <Modal open={adjOpen} onClose={() => setAdjOpen(false)} title="Stock Adjustment">
        <div className="space-y-4">
          <Select label="Product *" options={products.map((p) => ({ value: p.id, label: `${p.code} — ${p.name}` }))} value={adjForm.product} onChange={(e) => setAdjForm({ ...adjForm, product: e.target.value })} />
          <Input label="Quantity Change (+/-) *" type="number" value={adjForm.quantity_change} onChange={(e) => setAdjForm({ ...adjForm, quantity_change: e.target.value })} />
          <Select label="Reason *" options={ADJUSTMENT_REASONS} value={adjForm.reason} onChange={(e) => setAdjForm({ ...adjForm, reason: e.target.value })} />
          <Input label="Remarks" value={adjForm.remarks} onChange={(e) => setAdjForm({ ...adjForm, remarks: e.target.value })} />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setAdjOpen(false)}>Cancel</Button>
          <Button onClick={handleAdjustment} disabled={saving}>Save Adjustment</Button>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
