import { Pencil, Search, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  createDepartment,
  createPosition,
  deleteDepartment,
  deletePosition,
  fetchAllEmployees,
  fetchDepartments,
  fetchPositions,
  updateDepartment,
  updatePosition,
} from '../../api/hr'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Button } from '../../components/ui/Button'
import { DataTable, TableCell, TableRow } from '../../components/ui/DataTable'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { Select } from '../../components/ui/Select'
import { useAuth } from '../../context/AuthContext'
import { cn } from '../../lib/cn'
import type { Department, Employee, Position } from '../../types/hr'

const deptEmpty = { name: '', code: '', description: '', head: '' }
const posEmpty = { name: '', code: '', description: '', department: '' }

export function DepartmentsPage() {
  const { hasPermission } = useAuth()
  const canCreate = hasPermission('hr.departments.create')
  const canUpdate = hasPermission('hr.departments.update')
  const canDelete = hasPermission('hr.departments.delete')
  const [tab, setTab] = useState<'departments' | 'positions'>('departments')
  const [departments, setDepartments] = useState<Department[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingDept, setEditingDept] = useState<Department | null>(null)
  const [editingPos, setEditingPos] = useState<Position | null>(null)
  const [deptForm, setDeptForm] = useState(deptEmpty)
  const [posForm, setPosForm] = useState(posEmpty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [deptData, posData, employeeData] = await Promise.all([
        fetchDepartments({ search: search || undefined }),
        fetchPositions({ search: search || undefined }),
        canUpdate
          ? fetchAllEmployees({ status: 'active' }).catch(() => [])
          : Promise.resolve([]),
      ])
      setDepartments(deptData.results)
      setPositions(posData)
      setEmployees(employeeData)
    } finally {
      setLoading(false)
    }
  }, [canUpdate, search])

  useEffect(() => {
    load()
  }, [load])

  const openCreateDept = () => {
    setEditingDept(null)
    setEditingPos(null)
    setDeptForm(deptEmpty)
    setError('')
    setModalOpen(true)
  }

  const openCreatePos = () => {
    setEditingDept(null)
    setEditingPos(null)
    setPosForm({ ...posEmpty, department: departments[0]?.id ?? '' })
    setError('')
    setModalOpen(true)
  }

  const openEditDept = (dept: Department) => {
    setEditingDept(dept)
    setEditingPos(null)
    setDeptForm({
      name: dept.name,
      code: dept.code,
      description: dept.description ?? '',
      head: dept.head ?? '',
    })
    setError('')
    setModalOpen(true)
  }

  const openEditPos = (pos: Position) => {
    setEditingPos(pos)
    setEditingDept(null)
    setPosForm({
      name: pos.name,
      code: pos.code,
      description: pos.description ?? '',
      department: pos.department ?? '',
    })
    setError('')
    setModalOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      if (editingPos || (!editingDept && tab === 'positions')) {
        const payload = { ...posForm, department: posForm.department || null }
        if (editingPos) await updatePosition(editingPos.id, payload)
        else await createPosition(payload)
      } else {
        const payload = {
          name: deptForm.name,
          code: deptForm.code,
          description: deptForm.description,
          ...(editingDept ? { head: deptForm.head || null } : {}),
        }
        if (editingDept) await updateDepartment(editingDept.id, payload)
        else await createDepartment({ name: deptForm.name, code: deptForm.code, description: deptForm.description })
      }
      setModalOpen(false)
      load()
    } catch {
      setError('Failed to save. Code must be unique.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteDept = async (dept: Department) => {
    if (!confirm(`Disable department "${dept.name}"?`)) return
    try {
      await deleteDepartment(dept.id)
      load()
    } catch {
      alert('Cannot disable department with active employees.')
    }
  }

  const handleDeletePos = async (pos: Position) => {
    if (!confirm(`Disable position "${pos.name}"?`)) return
    try {
      await deletePosition(pos.id)
      load()
    } catch {
      alert('Cannot disable position assigned to employees.')
    }
  }

  const isPositionModal = editingPos !== null || (!editingDept && tab === 'positions')

  return (
    <DashboardLayout title="Departments">
      <PageHeader
        title="Departments & Positions"
        description="Organize your workforce structure."
        actionLabel={canCreate ? (tab === 'departments' ? '+ Add Department' : '+ Add Position') : undefined}
        onAction={canCreate ? (tab === 'departments' ? openCreateDept : openCreatePos) : undefined}
      />

      <div className="mb-4 flex gap-2 border-b border-slate-200 dark:border-slate-700">
        {(['departments', 'positions'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 text-sm font-medium capitalize transition-colors',
              tab === t
                ? 'border-b-2 border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder={`Search ${tab}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {tab === 'departments' ? (
        <DataTable
          loading={loading}
          isEmpty={!loading && departments.length === 0}
          emptyMessage="No departments found."
          columns={[
            { key: 'code', label: 'Code' },
            { key: 'name', label: 'Name' },
            { key: 'employees', label: 'Employees' },
            { key: 'head', label: 'Head' },
            { key: 'description', label: 'Description' },
            { key: 'actions', label: '', className: 'w-24' },
          ]}
        >
          {departments.map((dept) => (
            <TableRow key={dept.id}>
              <TableCell className="font-mono text-xs">{dept.code}</TableCell>
              <TableCell className="font-medium">{dept.name}</TableCell>
              <TableCell>{dept.employee_count}</TableCell>
              <TableCell>{dept.head_name || '—'}</TableCell>
              <TableCell className="max-w-xs truncate">{dept.description || '—'}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {canUpdate && <Button variant="ghost" size="sm" onClick={() => openEditDept(dept)}>
                    <Pencil className="h-4 w-4" />
                  </Button>}
                  {canDelete && <Button variant="ghost" size="sm" onClick={() => handleDeleteDept(dept)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </DataTable>
      ) : (
        <DataTable
          loading={loading}
          isEmpty={!loading && positions.length === 0}
          emptyMessage="No positions found."
          columns={[
            { key: 'code', label: 'Code' },
            { key: 'name', label: 'Name' },
            { key: 'department', label: 'Department' },
            { key: 'description', label: 'Description' },
            { key: 'actions', label: '', className: 'w-24' },
          ]}
        >
          {positions.map((pos) => (
            <TableRow key={pos.id}>
              <TableCell className="font-mono text-xs">{pos.code}</TableCell>
              <TableCell className="font-medium">{pos.name}</TableCell>
              <TableCell>{pos.department_name || '—'}</TableCell>
              <TableCell className="max-w-xs truncate">{pos.description || '—'}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {canUpdate && <Button variant="ghost" size="sm" onClick={() => openEditPos(pos)}>
                    <Pencil className="h-4 w-4" />
                  </Button>}
                  {canDelete && <Button variant="ghost" size="sm" onClick={() => handleDeletePos(pos)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </DataTable>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          isPositionModal
            ? editingPos ? 'Edit Position' : 'New Position'
            : editingDept ? 'Edit Department' : 'New Department'
        }
      >
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        {isPositionModal ? (
          <div className="grid gap-4">
            <Input label="Name" value={posForm.name} onChange={(e) => setPosForm({ ...posForm, name: e.target.value })} required />
            <Input label="Code" value={posForm.code} onChange={(e) => setPosForm({ ...posForm, code: e.target.value })} required />
            <Select label="Department" options={[{ value: '', label: 'None' }, ...departments.map((d) => ({ value: d.id, label: d.name }))]} value={posForm.department} onChange={(e) => setPosForm({ ...posForm, department: e.target.value })} />
            <Input label="Description" value={posForm.description} onChange={(e) => setPosForm({ ...posForm, description: e.target.value })} />
          </div>
        ) : (
          <div className="grid gap-4">
            <Input label="Name" value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} required />
            <Input label="Code" value={deptForm.code} onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })} required />
            {editingDept && (
              <Select
                label="Department head"
                placeholder="Select employee"
                value={deptForm.head}
                onChange={(e) => setDeptForm({ ...deptForm, head: e.target.value })}
                options={employees
                  .filter((employee) => employee.department === editingDept.id)
                  .map((employee) => ({
                    value: employee.id,
                    label: employee.full_name,
                  }))}
              />
            )}
            <Input label="Description" value={deptForm.description} onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })} />
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
