import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  createContractOption,
  createLeaveType,
  deleteContractOption,
  deleteLeaveType,
  fetchAttendancePolicy,
  fetchContractOptions,
  fetchLeaveTypeSettings,
  updateAttendancePolicy,
  updateContractOption,
  updateLeaveType,
} from '../../api/hr'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { DataTable, TableCell, TableRow } from '../../components/ui/DataTable'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { Select } from '../../components/ui/Select'
import { useAuth } from '../../context/AuthContext'
import { cn } from '../../lib/cn'
import type {
  AttendancePolicy,
  ContractOption,
  ContractOptionCategory,
  LeaveType,
} from '../../types/hr'

type SettingsTab = 'contract' | 'leave' | 'attendance'

const categoryOptions = [
  { value: 'work_type', label: 'Work Type' },
  { value: 'shift', label: 'Shift' },
  { value: 'wage_type', label: 'Wage Type' },
  { value: 'payment_frequency', label: 'Payment Frequency' },
]

export function HRSettingsPage() {
  const { hasPermission } = useAuth()
  const canCreate = hasPermission('core.settings.create')
  const canUpdate = hasPermission('core.settings.update')
  const canDelete = hasPermission('core.settings.delete')
  const [tab, setTab] = useState<SettingsTab>('contract')
  const [options, setOptions] = useState<ContractOption[]>([])
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [policy, setPolicy] = useState<AttendancePolicy | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [optionModal, setOptionModal] = useState(false)
  const [leaveModal, setLeaveModal] = useState(false)
  const [editingOption, setEditingOption] = useState<ContractOption | null>(null)
  const [editingLeave, setEditingLeave] = useState<LeaveType | null>(null)
  const [optionForm, setOptionForm] = useState({
    category: 'work_type' as ContractOptionCategory,
    name: '',
    code: '',
    description: '',
  })
  const [leaveForm, setLeaveForm] = useState({
    name: '',
    code: '',
    days_per_year: '0',
    is_paid: true,
    description: '',
  })
  const [policyForm, setPolicyForm] = useState({
    name: 'Default Working Hours',
    work_start_time: '09:00',
    work_end_time: '17:00',
    break_minutes: '0',
    late_grace_minutes: '0',
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [contractOptions, leaveData, attendancePolicy] = await Promise.all([
        fetchContractOptions(),
        fetchLeaveTypeSettings(),
        fetchAttendancePolicy(),
      ])
      setOptions(contractOptions)
      setLeaveTypes(leaveData)
      setPolicy(attendancePolicy)
      setPolicyForm({
        name: attendancePolicy.name,
        work_start_time: attendancePolicy.work_start_time.slice(0, 5),
        work_end_time: attendancePolicy.work_end_time.slice(0, 5),
        break_minutes: String(attendancePolicy.break_minutes),
        late_grace_minutes: String(attendancePolicy.late_grace_minutes),
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openOption = (option?: ContractOption) => {
    setEditingOption(option ?? null)
    setOptionForm(
      option
        ? {
            category: option.category,
            name: option.name,
            code: option.code,
            description: option.description,
          }
        : {
            category: 'work_type',
            name: '',
            code: '',
            description: '',
          },
    )
    setOptionModal(true)
  }

  const saveOption = async () => {
    setSaving(true)
    try {
      if (editingOption) {
        await updateContractOption(editingOption.id, optionForm)
      } else {
        await createContractOption(optionForm)
      }
      setOptionModal(false)
      load()
    } catch {
      alert('Could not save option. Code must be unique in its category.')
    } finally {
      setSaving(false)
    }
  }

  const openLeave = (leaveType?: LeaveType) => {
    setEditingLeave(leaveType ?? null)
    setLeaveForm(
      leaveType
        ? {
            name: leaveType.name,
            code: leaveType.code,
            days_per_year: String(leaveType.days_per_year),
            is_paid: leaveType.is_paid,
            description: leaveType.description ?? '',
          }
        : {
            name: '',
            code: '',
            days_per_year: '0',
            is_paid: true,
            description: '',
          },
    )
    setLeaveModal(true)
  }

  const saveLeave = async () => {
    setSaving(true)
    const payload = {
      ...leaveForm,
      days_per_year: Number(leaveForm.days_per_year),
    }
    try {
      if (editingLeave) await updateLeaveType(editingLeave.id, payload)
      else await createLeaveType(payload)
      setLeaveModal(false)
      load()
    } catch {
      alert('Could not save leave type. Code must be unique.')
    } finally {
      setSaving(false)
    }
  }

  const savePolicy = async () => {
    setSaving(true)
    try {
      const updated = await updateAttendancePolicy({
        ...policyForm,
        break_minutes: Number(policyForm.break_minutes),
        late_grace_minutes: Number(policyForm.late_grace_minutes),
      })
      setPolicy(updated)
      alert('Attendance working hours saved.')
    } catch {
      alert('Could not save working hours. End time must be after start time.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout title="HR Settings">
      <PageHeader
        title="HR Settings"
        description="Configure contract options, leave types, and attendance rules."
      />

      <div className="mb-5 flex gap-2 overflow-x-auto border-b border-slate-200 dark:border-slate-700">
        {(
          [
            ['contract', 'Contract Options'],
            ['leave', 'Leave Types'],
            ['attendance', 'Attendance'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              'whitespace-nowrap px-4 py-2 text-sm font-medium',
              tab === key
                ? 'border-b-2 border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'text-slate-500',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'contract' && (
        <>
          {canCreate && <div className="mb-4 flex justify-end">
            <Button onClick={() => openOption()}>
              <Plus className="h-4 w-4" /> Add Option
            </Button>
          </div>}
          <DataTable
            loading={loading}
            isEmpty={!loading && options.length === 0}
            emptyMessage="No contract options."
            columns={[
              { key: 'category', label: 'Category' },
              { key: 'name', label: 'Name' },
              { key: 'code', label: 'Code' },
              { key: 'description', label: 'Description' },
              { key: 'actions', label: '', className: 'w-24' },
            ]}
          >
            {options.map((option) => (
              <TableRow key={option.id}>
                <TableCell>{option.category_display}</TableCell>
                <TableCell className="font-medium">{option.name}</TableCell>
                <TableCell className="font-mono text-xs">{option.code}</TableCell>
                <TableCell>{option.description || '—'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {canUpdate && <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openOption(option)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>}
                    {canDelete && <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        if (!confirm(`Disable "${option.name}"?`)) return
                        await deleteContractOption(option.id)
                        load()
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </DataTable>
        </>
      )}

      {tab === 'leave' && (
        <>
          {canCreate && <div className="mb-4 flex justify-end">
            <Button onClick={() => openLeave()}>
              <Plus className="h-4 w-4" /> Add Leave Type
            </Button>
          </div>}
          <DataTable
            loading={loading}
            isEmpty={!loading && leaveTypes.length === 0}
            emptyMessage="No leave types."
            columns={[
              { key: 'name', label: 'Name' },
              { key: 'code', label: 'Code' },
              { key: 'days', label: 'Days / Year' },
              { key: 'paid', label: 'Paid' },
              { key: 'actions', label: '', className: 'w-24' },
            ]}
          >
            {leaveTypes.map((leaveType) => (
              <TableRow key={leaveType.id}>
                <TableCell className="font-medium">{leaveType.name}</TableCell>
                <TableCell className="font-mono text-xs">{leaveType.code}</TableCell>
                <TableCell>{leaveType.days_per_year}</TableCell>
                <TableCell>{leaveType.is_paid ? 'Yes' : 'No'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {canUpdate && <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openLeave(leaveType)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>}
                    {canDelete && <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        if (!confirm(`Disable "${leaveType.name}"?`)) return
                        await deleteLeaveType(leaveType.id)
                        load()
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </DataTable>
        </>
      )}

      {tab === 'attendance' && (
        <Card className="max-w-2xl p-5">
          <h3 className="mb-1 font-semibold text-slate-900 dark:text-white">
            Standard Working Hours
          </h3>
          <p className="mb-5 text-sm text-slate-500">
            Used to calculate late time, early leave, overtime, and manual
            attendance without clock times.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Policy Name"
              value={policyForm.name}
              onChange={(event) =>
                setPolicyForm({ ...policyForm, name: event.target.value })
              }
            />
            <div className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800">
              Scheduled hours: <strong>{policy?.scheduled_hours ?? '—'}h</strong>
            </div>
            <Input
              label="Work Start"
              type="time"
              value={policyForm.work_start_time}
              onChange={(event) =>
                setPolicyForm({
                  ...policyForm,
                  work_start_time: event.target.value,
                })
              }
            />
            <Input
              label="Work End"
              type="time"
              value={policyForm.work_end_time}
              onChange={(event) =>
                setPolicyForm({
                  ...policyForm,
                  work_end_time: event.target.value,
                })
              }
            />
            <Input
              label="Break (minutes)"
              type="number"
              min="0"
              value={policyForm.break_minutes}
              onChange={(event) =>
                setPolicyForm({
                  ...policyForm,
                  break_minutes: event.target.value,
                })
              }
            />
            <Input
              label="Late Grace (minutes)"
              type="number"
              min="0"
              value={policyForm.late_grace_minutes}
              onChange={(event) =>
                setPolicyForm({
                  ...policyForm,
                  late_grace_minutes: event.target.value,
                })
              }
            />
          </div>
          {canUpdate && <div className="mt-5 flex justify-end">
            <Button onClick={savePolicy} disabled={saving}>
              {saving ? 'Saving...' : 'Save Working Hours'}
            </Button>
          </div>}
        </Card>
      )}

      <Modal
        open={optionModal}
        onClose={() => setOptionModal(false)}
        title={editingOption ? 'Edit Contract Option' : 'Add Contract Option'}
      >
        <div className="grid gap-4">
          <Select
            label="Category"
            options={categoryOptions}
            value={optionForm.category}
            onChange={(event) =>
              setOptionForm({
                ...optionForm,
                category: event.target.value as ContractOptionCategory,
              })
            }
          />
          <Input
            label="Name"
            value={optionForm.name}
            onChange={(event) =>
              setOptionForm({ ...optionForm, name: event.target.value })
            }
          />
          <Input
            label="Code"
            value={optionForm.code}
            onChange={(event) =>
              setOptionForm({
                ...optionForm,
                code: event.target.value.toLowerCase().replace(/\s+/g, '_'),
              })
            }
          />
          <Input
            label="Description"
            value={optionForm.description}
            onChange={(event) =>
              setOptionForm({
                ...optionForm,
                description: event.target.value,
              })
            }
          />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOptionModal(false)}>
            Cancel
          </Button>
          <Button
            onClick={saveOption}
            disabled={saving || !optionForm.name || !optionForm.code}
          >
            Save
          </Button>
        </div>
      </Modal>

      <Modal
        open={leaveModal}
        onClose={() => setLeaveModal(false)}
        title={editingLeave ? 'Edit Leave Type' : 'Add Leave Type'}
      >
        <div className="grid gap-4">
          <Input
            label="Name"
            value={leaveForm.name}
            onChange={(event) =>
              setLeaveForm({ ...leaveForm, name: event.target.value })
            }
          />
          <Input
            label="Code"
            value={leaveForm.code}
            onChange={(event) =>
              setLeaveForm({
                ...leaveForm,
                code: event.target.value.toUpperCase().replace(/\s+/g, '_'),
              })
            }
          />
          <Input
            label="Days Per Year"
            type="number"
            min="0"
            value={leaveForm.days_per_year}
            onChange={(event) =>
              setLeaveForm({
                ...leaveForm,
                days_per_year: event.target.value,
              })
            }
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={leaveForm.is_paid}
              onChange={(event) =>
                setLeaveForm({
                  ...leaveForm,
                  is_paid: event.target.checked,
                })
              }
            />
            Paid leave
          </label>
          <Input
            label="Description"
            value={leaveForm.description}
            onChange={(event) =>
              setLeaveForm({
                ...leaveForm,
                description: event.target.value,
              })
            }
          />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setLeaveModal(false)}>
            Cancel
          </Button>
          <Button
            onClick={saveLeave}
            disabled={saving || !leaveForm.name || !leaveForm.code}
          >
            Save
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
