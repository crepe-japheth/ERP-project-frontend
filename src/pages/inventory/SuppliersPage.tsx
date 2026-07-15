import { Pencil, Search, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  createSupplier,
  deleteSupplier,
  fetchSuppliers,
  updateSupplier,
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
import type { Supplier } from '../../types/inventory'

const emptyForm = {
  name: '',
  code: '',
  contact_person: '',
  phone: '',
  email: '',
  address: '',
  tax_number: '',
  status: 'active',
}

export function SuppliersPage() {
  const { hasPermission } = useAuth()
  const canCreate = hasPermission('inventory.suppliers.create')
  const canUpdate = hasPermission('inventory.suppliers.update')
  const canDelete = hasPermission('inventory.suppliers.delete')
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchSuppliers({ search: search || undefined })
      setSuppliers(data.results)
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

  const openEdit = (s: Supplier) => {
    setEditing(s)
    setForm({
      name: s.name,
      code: s.code,
      contact_person: s.contact_person,
      phone: s.phone,
      email: s.email,
      address: s.address,
      tax_number: s.tax_number,
      status: s.status,
    })
    setError('')
    setModalOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      if (editing) {
        await updateSupplier(editing.id, form as Partial<Supplier>)
      } else {
        await createSupplier(form as Partial<Supplier>)
      }
      setModalOpen(false)
      load()
    } catch {
      setError('Failed to save supplier. Code must be unique.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (s: Supplier) => {
    if (!confirm(`Disable supplier "${s.name}"?`)) return
    await deleteSupplier(s.id)
    load()
  }

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }))

  return (
    <DashboardLayout title="Suppliers">
      <PageHeader
        title="Suppliers"
        description="Manage vendor and supplier information."
        actionLabel={canCreate ? '+ Add Supplier' : undefined}
        onAction={canCreate ? openCreate : undefined}
      />

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search suppliers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <DataTable
        loading={loading}
        isEmpty={!loading && suppliers.length === 0}
        columns={[
          { key: 'code', label: 'Code' },
          { key: 'name', label: 'Supplier' },
          { key: 'contact', label: 'Contact' },
          { key: 'phone', label: 'Phone' },
          { key: 'status', label: 'Status' },
          { key: 'actions', label: '', className: 'w-24' },
        ]}
      >
        {suppliers.map((s) => (
          <TableRow key={s.id}>
            <TableCell className="font-mono text-xs">{s.code}</TableCell>
            <TableCell className="font-medium text-slate-900 dark:text-white">{s.name}</TableCell>
            <TableCell>{s.contact_person || '—'}</TableCell>
            <TableCell>{s.phone || '—'}</TableCell>
            <TableCell>
              <Badge variant={s.status === 'active' ? 'success' : 'default'}>
                {s.status}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex gap-1">
                {canUpdate && <button type="button" onClick={() => openEdit(s)} className="rounded-lg p-1.5 text-slate-400 hover:text-emerald-600">
                  <Pencil className="h-4 w-4" />
                </button>}
                {canDelete && <button type="button" onClick={() => handleDelete(s)} className="rounded-lg p-1.5 text-slate-400 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </DataTable>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Supplier' : 'Add Supplier'} size="lg">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Supplier Name *" value={form.name} onChange={(e) => set('name', e.target.value)} />
          <Input label="Code *" value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())} />
          <Input label="Contact Person" value={form.contact_person} onChange={(e) => set('contact_person', e.target.value)} />
          <Input label="Phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          <Input label="Tax Number" value={form.tax_number} onChange={(e) => set('tax_number', e.target.value)} />
          <Select
            label="Status"
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            value={form.status}
            onChange={(e) => set('status', e.target.value)}
          />
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Address</label>
            <textarea
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
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
