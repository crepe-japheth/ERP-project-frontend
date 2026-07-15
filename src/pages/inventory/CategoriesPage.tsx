import { Pencil, Search, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
} from '../../api/inventory'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Button } from '../../components/ui/Button'
import { DataTable, TableCell, TableRow } from '../../components/ui/DataTable'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { useAuth } from '../../context/AuthContext'
import type { Category } from '../../types/inventory'

const emptyForm = { name: '', code: '', description: '', parent: '' }

export function CategoriesPage() {
  const { hasPermission } = useAuth()
  const canCreate = hasPermission('inventory.categories.create')
  const canUpdate = hasPermission('inventory.categories.update')
  const canDelete = hasPermission('inventory.categories.delete')
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchCategories({ search: search || undefined })
      setCategories(data.results)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setError('')
    setModalOpen(true)
  }

  const openEdit = (cat: Category) => {
    setEditing(cat)
    setForm({
      name: cat.name,
      code: cat.code,
      description: cat.description ?? '',
      parent: cat.parent ?? '',
    })
    setError('')
    setModalOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const payload = { ...form, parent: form.parent || null }
      if (editing) {
        await updateCategory(editing.id, payload)
      } else {
        await createCategory(payload)
      }
      setModalOpen(false)
      load()
    } catch {
      setError('Failed to save category. Code must be unique.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (cat: Category) => {
    if (!confirm(`Disable category "${cat.name}"?`)) return
    try {
      await deleteCategory(cat.id)
      load()
    } catch {
      alert('Cannot disable category with active products.')
    }
  }

  return (
    <DashboardLayout title="Categories">
      <PageHeader
        title="Categories"
        description="Organize products into categories."
        actionLabel={canCreate ? '+ Add Category' : undefined}
        onAction={canCreate ? openCreate : undefined}
      />

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <DataTable
        loading={loading}
        isEmpty={!loading && categories.length === 0}
        columns={[
          { key: 'code', label: 'Code' },
          { key: 'name', label: 'Name' },
          { key: 'parent', label: 'Parent' },
          { key: 'products', label: 'Products' },
          { key: 'actions', label: '', className: 'w-24' },
        ]}
      >
        {categories.map((c) => (
          <TableRow key={c.id}>
            <TableCell className="font-mono text-xs">{c.code}</TableCell>
            <TableCell className="font-medium text-slate-900 dark:text-white">{c.name}</TableCell>
            <TableCell>{c.parent_name ?? '—'}</TableCell>
            <TableCell>{c.product_count}</TableCell>
            <TableCell>
              <div className="flex gap-1">
                {canUpdate && <button type="button" onClick={() => openEdit(c)} className="rounded-lg p-1.5 text-slate-400 hover:text-emerald-600">
                  <Pencil className="h-4 w-4" />
                </button>}
                {canDelete && <button type="button" onClick={() => handleDelete(c)} className="rounded-lg p-1.5 text-slate-400 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </DataTable>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Category' : 'Add Category'}>
        <div className="space-y-4">
          <Input label="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Code *" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
