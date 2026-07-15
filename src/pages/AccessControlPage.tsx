import { Pencil, ShieldCheck, UserX } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createUser,
  deactivateUser,
  fetchAllUsers,
  fetchPermissions,
  updateUser,
} from '../api/access'
import { fetchAllEmployees } from '../api/hr'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { DataTable, TableCell, TableRow } from '../components/ui/DataTable'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { Select } from '../components/ui/Select'
import { cn } from '../lib/cn'
import { useAuth } from '../context/AuthContext'
import type { Permission, User } from '../types/auth'
import type { Employee } from '../types/hr'

type AccessMode = 'none' | 'view' | 'manage'

const emptyForm = {
  username: '',
  password: '',
  email: '',
  first_name: '',
  last_name: '',
  phone: '',
  employee_id: '',
  permission_ids: [] as string[],
  is_active: true,
}

function title(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

export function AccessControlPage() {
  const { hasPermission } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [form, setForm] = useState(emptyForm)
  const canCreate =
    hasPermission('core.users.create') &&
    hasPermission('core.roles.update')
  const canUpdate = hasPermission('core.users.update')
  const canAssignPermissions = hasPermission('core.roles.update')
  const canDelete = hasPermission('core.users.delete')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [userPage, permissionList, employeeList] = await Promise.all([
        fetchAllUsers(),
        fetchPermissions(),
        fetchAllEmployees(),
      ])
      setUsers(userPage)
      setPermissions(permissionList)
      setEmployees(employeeList)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const groupedPermissions = useMemo(() => {
    const groups = new Map<string, Map<string, Permission[]>>()
    permissions.forEach((permission) => {
      const [moduleName] = permission.module.split('.')
      if (!groups.has(moduleName)) groups.set(moduleName, new Map())
      const sections = groups.get(moduleName)!
      if (!sections.has(permission.module)) sections.set(permission.module, [])
      sections.get(permission.module)!.push(permission)
    })
    return groups
  }, [permissions])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm, permission_ids: [] })
    setOpen(true)
  }

  const openEdit = (user: User) => {
    setEditing(user)
    setForm({
      username: user.username,
      password: '',
      email: user.email || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone || '',
      employee_id: user.employee_id || '',
      permission_ids: [...(user.direct_permission_ids || [])],
      is_active: user.is_active,
    })
    setOpen(true)
  }

  const sectionMode = (sectionPermissions: Permission[]): AccessMode => {
    const selected = sectionPermissions.filter((permission) =>
      form.permission_ids.includes(permission.id),
    )
    if (selected.some((permission) => permission.action !== 'read')) {
      return 'manage'
    }
    return selected.some((permission) => permission.action === 'read')
      ? 'view'
      : 'none'
  }

  const setSectionMode = (
    sectionPermissions: Permission[],
    mode: AccessMode,
  ) => {
    const sectionIds = new Set(
      sectionPermissions.map((permission) => permission.id),
    )
    const withoutSection = form.permission_ids.filter(
      (id) => !sectionIds.has(id),
    )
    const selected =
      mode === 'manage'
        ? sectionPermissions.map((permission) => permission.id)
        : mode === 'view'
          ? sectionPermissions
              .filter((permission) => permission.action === 'read')
              .map((permission) => permission.id)
          : []
    setForm({
      ...form,
      permission_ids: [...withoutSection, ...selected],
    })
  }

  const save = async () => {
    setSaving(true)
    try {
      const common = {
        email: form.email,
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone,
        employee_id: form.employee_id || null,
      }
      if (editing) {
        await updateUser(editing.id, {
          ...common,
          is_active: form.is_active,
          ...(canAssignPermissions
            ? { permission_ids: form.permission_ids }
            : {}),
        })
      } else {
        await createUser({
          ...common,
          username: form.username,
          password: form.password,
          permission_ids: form.permission_ids,
        })
      }
      setOpen(false)
      load()
    } catch {
      alert(
        'Could not save the user. Check the username, password, employee link, and your access-control permissions.',
      )
    } finally {
      setSaving(false)
    }
  }

  const employeeName = (id: string | null) =>
    employees.find((employee) => employee.id === id)?.full_name || '—'
  const assignedEmployeeIds = new Set(
    users
      .filter((user) => user.id !== editing?.id)
      .map((user) => user.employee_id)
      .filter(Boolean),
  )

  return (
    <DashboardLayout title="User Access">
      <PageHeader
        title="User Access"
        description="Assign access directly by module, section, and capability."
        actionLabel={canCreate ? '+ Add User' : undefined}
        onAction={canCreate ? openCreate : undefined}
      />

      <DataTable
        loading={loading}
        isEmpty={!loading && users.length === 0}
        emptyMessage="No user accounts."
        columns={[
          { key: 'user', label: 'User' },
          { key: 'employee', label: 'Employee Profile' },
          { key: 'access', label: 'Direct Permissions' },
          { key: 'status', label: 'Status' },
          { key: 'actions', label: '', className: 'w-24' },
        ]}
      >
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>
              <p className="font-medium">
                {user.first_name || user.last_name
                  ? `${user.first_name} ${user.last_name}`.trim()
                  : user.username}
              </p>
              <p className="text-xs text-slate-500">
                {user.username} · {user.email || 'No email'}
              </p>
            </TableCell>
            <TableCell>{employeeName(user.employee_id)}</TableCell>
            <TableCell>
              {user.is_superuser
                ? 'Full system access'
                : `${user.direct_permission_ids?.length || 0} permissions`}
            </TableCell>
            <TableCell>
              <Badge variant={user.is_active ? 'success' : 'danger'}>
                {user.is_active ? 'Active' : 'Disabled'}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex gap-1">
                {canUpdate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(user)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                {canDelete && user.is_active && !user.is_superuser && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      if (!confirm(`Disable account "${user.username}"?`)) return
                      await deactivateUser(user.id)
                      load()
                    }}
                  >
                    <UserX className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </DataTable>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `Edit ${editing.username}` : 'Add User'}
        size="lg"
      >
        <div className="grid max-h-[70vh] gap-5 overflow-y-auto pr-1">
          {canAssignPermissions && (
          <Card className="p-4">
            <h3 className="mb-3 font-semibold">Account</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Username"
                disabled={Boolean(editing)}
                value={form.username}
                onChange={(event) =>
                  setForm({ ...form, username: event.target.value })
                }
              />
              {!editing && (
                <Input
                  label="Temporary Password"
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    setForm({ ...form, password: event.target.value })
                  }
                />
              )}
              <Input
                label="First Name"
                value={form.first_name}
                onChange={(event) =>
                  setForm({ ...form, first_name: event.target.value })
                }
              />
              <Input
                label="Last Name"
                value={form.last_name}
                onChange={(event) =>
                  setForm({ ...form, last_name: event.target.value })
                }
              />
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
              />
              <Input
                label="Phone"
                value={form.phone}
                onChange={(event) =>
                  setForm({ ...form, phone: event.target.value })
                }
              />
              <div className="sm:col-span-2">
                <Select
                  label="Linked Employee (enables personal access)"
                  options={[
                    { value: '', label: 'No employee profile' },
                    ...employees
                      .filter(
                        (employee) => !assignedEmployeeIds.has(employee.id),
                      )
                      .map((employee) => ({
                        value: employee.id,
                        label: `${employee.full_name} (${employee.employee_number})`,
                      })),
                  ]}
                  value={form.employee_id}
                  onChange={(event) =>
                    setForm({ ...form, employee_id: event.target.value })
                  }
                />
              </div>
              {editing && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(event) =>
                      setForm({ ...form, is_active: event.target.checked })
                    }
                  />
                  Account active
                </label>
              )}
            </div>
          </Card>
          )}

          <Card className="p-4">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <div>
                <h3 className="font-semibold">Management Access</h3>
                <p className="text-xs text-slate-500">
                  Personal employee access does not require these permissions.
                </p>
              </div>
            </div>
            <div className="space-y-5">
              {Array.from(groupedPermissions.entries()).map(
                ([moduleName, sections]) => (
                  <div key={moduleName}>
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                      {title(moduleName)}
                    </h4>
                    <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 dark:divide-slate-700 dark:border-slate-700">
                      {Array.from(sections.entries()).map(
                        ([section, sectionPermissions]) => {
                          const mode = sectionMode(sectionPermissions)
                          return (
                            <div
                              key={section}
                              className="flex flex-wrap items-center justify-between gap-3 p-3"
                            >
                              <span className="text-sm font-medium">
                                {title(section.split('.')[1])}
                              </span>
                              <div className="flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                                {(
                                  ['none', 'view', 'manage'] as AccessMode[]
                                ).map((accessMode) => (
                                  <button
                                    key={accessMode}
                                    type="button"
                                    onClick={() =>
                                      setSectionMode(
                                        sectionPermissions,
                                        accessMode,
                                      )
                                    }
                                    className={cn(
                                      'rounded-md px-3 py-1 text-xs font-medium',
                                      mode === accessMode
                                        ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-700 dark:text-emerald-400'
                                        : 'text-slate-500',
                                    )}
                                  >
                                    {title(accessMode)}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )
                        },
                      )}
                    </div>
                  </div>
                ),
              )}
            </div>
          </Card>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={save}
            disabled={
              saving ||
              !form.username ||
              (!editing && form.password.length < 8)
            }
          >
            {saving ? 'Saving...' : 'Save User Access'}
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
