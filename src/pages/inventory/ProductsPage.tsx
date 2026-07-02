import { Pencil, Search, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  createProduct,
  deleteProduct,
  fetchCategories,
  fetchProducts,
  fetchUnits,
  updateProduct,
} from '../../api/inventory'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { DataTable, TableCell, TableRow } from '../../components/ui/DataTable'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { Select } from '../../components/ui/Select'
import type { Category, Product, UnitOfMeasure } from '../../types/inventory'

const ITEM_TYPES = [
  { value: 'consumable', label: 'Consumable' },
  { value: 'returnable', label: 'Returnable Asset' },
  { value: 'mixed', label: 'Mixed' },
]

const emptyForm = {
  code: '',
  barcode: '',
  name: '',
  description: '',
  category: '',
  unit: '',
  item_type: 'consumable',
  minimum_stock: '0',
  maximum_stock: '0',
  reorder_level: '0',
  status: 'active',
}

function itemTypeBadge(type: string) {
  if (type === 'consumable') return 'warning'
  if (type === 'returnable') return 'info'
  return 'purple'
}

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [units, setUnits] = useState<UnitOfMeasure[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [prodData, catData, unitData] = await Promise.all([
        fetchProducts({ search: search || undefined, item_type: filterType || undefined }),
        fetchCategories(),
        fetchUnits(),
      ])
      setProducts(prodData.results)
      setCategories(catData.results)
      setUnits(unitData)
    } finally {
      setLoading(false)
    }
  }, [search, filterType])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm({
      ...emptyForm,
      category: categories[0]?.id ?? '',
      unit: units[0]?.id ?? '',
    })
    setError('')
    setModalOpen(true)
  }

  const openEdit = (product: Product) => {
    setEditing(product)
    setForm({
      code: product.code,
      barcode: product.barcode,
      name: product.name,
      description: product.description ?? '',
      category: product.category,
      unit: product.unit,
      item_type: product.item_type,
      minimum_stock: String(product.minimum_stock),
      maximum_stock: String(product.maximum_stock),
      reorder_level: String(product.reorder_level),
      status: product.status,
    })
    setError('')
    setModalOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      if (editing) {
        await updateProduct(editing.id, form as Partial<Product>)
      } else {
        await createProduct(form as Partial<Product>)
      }
      setModalOpen(false)
      load()
    } catch {
      setError('Failed to save product. Check required fields and unique code.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (product: Product) => {
    if (!confirm(`Disable product "${product.name}"?`)) return
    await deleteProduct(product.id)
    load()
  }

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }))

  return (
    <DashboardLayout title="Products">
      <PageHeader
        title="Products"
        description="Manage inventory items, stock levels, and item types."
        actionLabel="+ Add Product"
        onAction={openCreate}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name, code, or barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          options={[{ value: '', label: 'All types' }, ...ITEM_TYPES]}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="sm:w-48"
        />
      </div>

      <DataTable
        loading={loading}
        isEmpty={!loading && products.length === 0}
        columns={[
          { key: 'code', label: 'Code' },
          { key: 'name', label: 'Product' },
          { key: 'category', label: 'Category' },
          { key: 'type', label: 'Type' },
          { key: 'stock', label: 'Stock' },
          { key: 'status', label: 'Status' },
          { key: 'actions', label: '', className: 'w-24' },
        ]}
      >
        {products.map((p) => (
          <TableRow key={p.id}>
            <TableCell className="font-mono text-xs font-medium">{p.code}</TableCell>
            <TableCell>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{p.name}</p>
                {p.barcode && (
                  <p className="text-xs text-slate-400">{p.barcode}</p>
                )}
              </div>
            </TableCell>
            <TableCell>{p.category_name}</TableCell>
            <TableCell>
              <Badge variant={itemTypeBadge(p.item_type)}>{p.item_type_display}</Badge>
            </TableCell>
            <TableCell>
              <span className="font-medium">{p.current_quantity}</span>
              <span className="text-slate-400"> {p.unit_symbol}</span>
            </TableCell>
            <TableCell>
              <Badge variant={p.status === 'active' ? 'success' : 'default'}>
                {p.status_display}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => openEdit(p)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-emerald-600 dark:hover:bg-slate-800"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(p)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </DataTable>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Product' : 'Add Product'}
        size="lg"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Product Code *" value={form.code} onChange={(e) => set('code', e.target.value)} />
          <Input label="Barcode" value={form.barcode} onChange={(e) => set('barcode', e.target.value)} />
          <div className="sm:col-span-2">
            <Input label="Product Name *" value={form.name} onChange={(e) => set('name', e.target.value)} />
          </div>
          <Select
            label="Category *"
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
          />
          <Select
            label="Unit of Measure *"
            options={units.map((u) => ({ value: u.id, label: `${u.name} (${u.symbol})` }))}
            value={form.unit}
            onChange={(e) => set('unit', e.target.value)}
          />
          <Select
            label="Item Type *"
            options={ITEM_TYPES}
            value={form.item_type}
            onChange={(e) => set('item_type', e.target.value)}
          />
          <Select
            label="Status"
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            value={form.status}
            onChange={(e) => set('status', e.target.value)}
          />
          <Input label="Minimum Stock" type="number" value={form.minimum_stock} onChange={(e) => set('minimum_stock', e.target.value)} />
          <Input label="Maximum Stock" type="number" value={form.maximum_stock} onChange={(e) => set('maximum_stock', e.target.value)} />
          <Input label="Reorder Level" type="number" value={form.reorder_level} onChange={(e) => set('reorder_level', e.target.value)} />
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
