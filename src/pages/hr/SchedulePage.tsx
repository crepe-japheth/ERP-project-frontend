import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  History,
  Loader2,
  Plus,
  Search,
  Send,
  Settings2,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createSchedule,
  createShift,
  createShiftTemplate,
  deleteShift,
  deleteShiftTemplate,
  fetchScheduleRevisions,
  fetchSchedules,
  fetchSchedulingEmployees,
  fetchShiftTemplates,
  fetchShifts,
  generateSchedule,
  publishSchedule,
  reviseSchedule,
  updateShift,
  validateSchedule,
} from '../../api/scheduling'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { Select } from '../../components/ui/Select'
import { useAuth } from '../../context/AuthContext'
import { getApiDetail } from '../../lib/apiError'
import { cn } from '../../lib/cn'
import {
  addDays,
  formatDayHeading,
  formatShiftTime,
  formatWeekRange,
  shiftHours,
  slugify,
  startOfWeekMonday,
  toIsoDate,
} from '../../lib/week'
import type {
  Schedule,
  ScheduleIssue,
  ScheduleRevision,
  SchedulableEmployee,
  Shift,
  ShiftTemplate,
} from '../../types/scheduling'

const TEMPLATE_COLORS = ['#10b981', '#34d399', '#f59e0b', '#ef4444', '#6366f1', '#06b6d4', '#8b5cf6']

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function localTime(iso: string) {
  const value = new Date(iso)
  return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`
}

function toTimeInput(value: string) {
  return value.slice(0, 5)
}

function chipStyle(color: string) {
  return {
    backgroundColor: `${color}22`,
    borderLeft: `3px solid ${color}`,
    color: color,
  }
}

export function SchedulePage() {
  const { hasPermission } = useAuth()
  const canCreate = hasPermission('hr.schedule.create')
  const canUpdate = hasPermission('hr.schedule.update')
  const canDelete = hasPermission('hr.schedule.delete')
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday())
  const [employees, setEmployees] = useState<SchedulableEmployee[]>([])
  const [templates, setTemplates] = useState<ShiftTemplate[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [departmentId, setDepartmentId] = useState('')
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [shiftModal, setShiftModal] = useState(false)
  const [templateModal, setTemplateModal] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [revisions, setRevisions] = useState<ScheduleRevision[]>([])
  const [publishIssues, setPublishIssues] = useState<ScheduleIssue[]>([])
  const [editingShift, setEditingShift] = useState<Shift | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [shiftForm, setShiftForm] = useState({
    employee: '',
    date: '',
    template: '',
    start_time: '08:30',
    end_time: '15:30',
    break_minutes: '30',
    notes: '',
  })
  const [templateForm, setTemplateForm] = useState({
    name: '',
    code: '',
    color: TEMPLATE_COLORS[0],
    start_time: '08:30',
    end_time: '15:30',
    break_minutes: '30',
    is_overnight: false,
  })

  const isLocked = schedule?.status === 'published'
  const canEditShifts = Boolean(canCreate && schedule && !isLocked)
  const canPublish = Boolean(canUpdate && schedule && !isLocked)

  const days = useMemo(() => formatWeekDays(weekStart), [weekStart])
  const departments = useMemo(() => {
    const map = new Map<string, string>()
    employees.forEach((employee) => {
      if (employee.department) map.set(employee.department, employee.department_name)
    })
    templates.forEach((template) => {
      map.set(template.department, template.department_name)
    })
    return [...map.entries()].map(([id, name]) => ({ id, name }))
  }, [employees, templates])

  const visibleEmployees = useMemo(() => {
    const query = search.trim().toLowerCase()
    return employees.filter((employee) => {
      if (departmentId && employee.department !== departmentId) return false
      if (!query) return true
      return (
        employee.full_name.toLowerCase().includes(query) ||
        employee.employee_number.toLowerCase().includes(query) ||
        employee.position_name.toLowerCase().includes(query)
      )
    })
  }, [employees, departmentId, search])

  const shiftsByEmployeeDate = useMemo(() => {
    const map = new Map<string, Shift[]>()
    shifts.forEach((shift) => {
      shift.assignments.forEach((assignment) => {
        const key = `${assignment.employee}:${shift.date}`
        const current = map.get(key) ?? []
        current.push(shift)
        map.set(key, current)
      })
    })
    return map
  }, [shifts])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const weekStartIso = toIsoDate(weekStart)
      const weekEndIso = toIsoDate(addDays(weekStart, 6))
      const people = await fetchSchedulingEmployees({
        ...(departmentId ? { department: departmentId } : {}),
        start: weekStartIso,
        end: weekEndIso,
      })
      setEmployees(people)
      if (!departmentId) {
        const inferred = people.find((employee) => employee.department)?.department || ''
        if (inferred) {
          setDepartmentId(inferred)
        } else {
          setTemplates([])
          setShifts([])
          setSchedule(null)
          setPublishIssues([])
        }
        return
      }
      const [templateList, scheduleList] = await Promise.all([
        fetchShiftTemplates({ department: departmentId }),
        fetchSchedules({ department: departmentId }),
      ])
      setTemplates(templateList)
      const matching = scheduleList.filter(
        (item) =>
          item.start_date === weekStartIso &&
          item.end_date === weekEndIso &&
          item.status !== 'archived',
      )
      const draft = matching.find(
        (item) => item.status === 'draft' || item.status === 'in_review',
      )
      const published = matching.find((item) => item.status === 'published')
      let current = draft || published
      if (!current && !published && canCreate) {
        current = await createSchedule({
          name: `Week of ${weekStartIso}`,
          department: departmentId,
          start_date: weekStartIso,
          end_date: weekEndIso,
        })
      }
      setSchedule(current ?? null)
      const shiftList = current
        ? await fetchShifts({ schedule: current.id })
        : []
      setShifts(shiftList)
      if (current) {
        const report = await validateSchedule(current.id)
        setPublishIssues(report.issues)
      } else {
        setPublishIssues([])
      }
    } catch (err) {
      setError(getApiDetail(err, 'Unable to load the weekly schedule.'))
    } finally {
      setLoading(false)
    }
  }, [canCreate, departmentId, weekStart])

  useEffect(() => {
    load()
  }, [load])

  const openCreateShift = (employeeId = '', date = toIsoDate(weekStart)) => {
    const template = templates[0]
    setEditingShift(null)
    setShiftForm({
      employee: employeeId || visibleEmployees[0]?.id || '',
      date,
      template: template?.id ?? '',
      start_time: template ? toTimeInput(template.start_time) : '08:30',
      end_time: template ? toTimeInput(template.end_time) : '15:30',
      break_minutes: String(template?.break_minutes ?? 30),
      notes: '',
    })
    setFormError('')
    setShiftModal(true)
  }

  const openEditShift = (shift: Shift, employeeId: string) => {
    setEditingShift(shift)
    setShiftForm({
      employee: employeeId,
      date: shift.date,
      template: shift.template ?? '',
      start_time: localTime(shift.starts_at),
      end_time: localTime(shift.ends_at),
      break_minutes: String(shift.break_minutes),
      notes: shift.notes,
    })
    setFormError('')
    setShiftModal(true)
  }

  const applyTemplate = (templateId: string) => {
    const template = templates.find((item) => item.id === templateId)
    setShiftForm((current) => ({
      ...current,
      template: templateId,
      start_time: template ? toTimeInput(template.start_time) : current.start_time,
      end_time: template ? toTimeInput(template.end_time) : current.end_time,
      break_minutes: String(template?.break_minutes ?? current.break_minutes),
    }))
  }

  const saveShift = async () => {
    if (!schedule || isLocked) {
      setFormError('This week is published. Create a new revision to make changes.')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const overnight = shiftForm.end_time <= shiftForm.start_time
      const payload = {
        schedule: schedule.id,
        template: shiftForm.template || null,
        date: shiftForm.date,
        start_time: shiftForm.start_time,
        end_time: shiftForm.end_time,
        is_overnight: overnight,
        break_minutes: Number(shiftForm.break_minutes) || 0,
        notes: shiftForm.notes,
        employee_ids: shiftForm.employee ? [shiftForm.employee] : [],
      }
      if (editingShift) {
        await updateShift(editingShift.id, payload)
      } else {
        await createShift(payload)
      }
      setShiftModal(false)
      await load()
    } catch (err) {
      setFormError(getApiDetail(err, 'Could not save this shift.'))
    } finally {
      setSaving(false)
    }
  }

  const removeShift = async () => {
    if (!editingShift) return
    if (!confirm('Remove this shift from the week?')) return
    setSaving(true)
    try {
      await deleteShift(editingShift.id)
      setShiftModal(false)
      await load()
    } catch (err) {
      setFormError(getApiDetail(err, 'Could not delete this shift.'))
    } finally {
      setSaving(false)
    }
  }

  const saveTemplate = async () => {
    if (!departmentId) {
      setFormError('Select a department before creating a template.')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      await createShiftTemplate({
        name: templateForm.name,
        code: templateForm.code || slugify(templateForm.name),
        color: templateForm.color,
        start_time: templateForm.start_time,
        end_time: templateForm.end_time,
        break_minutes: Number(templateForm.break_minutes) || 0,
        is_overnight:
          templateForm.is_overnight || templateForm.end_time <= templateForm.start_time,
        department: departmentId,
      })
      setTemplateForm({
        name: '',
        code: '',
        color: TEMPLATE_COLORS[0],
        start_time: '08:30',
        end_time: '15:30',
        break_minutes: '30',
        is_overnight: false,
      })
      const next = await fetchShiftTemplates({ department: departmentId })
      setTemplates(next)
    } catch (err) {
      setFormError(getApiDetail(err, 'Could not save the template.'))
    } finally {
      setSaving(false)
    }
  }

  const removeTemplate = async (template: ShiftTemplate) => {
    if (!confirm(`Delete template “${template.name}”?`)) return
    try {
      await deleteShiftTemplate(template.id)
      setTemplates((current) => current.filter((item) => item.id !== template.id))
    } catch (err) {
      setFormError(getApiDetail(err, 'Could not delete the template.'))
    }
  }

  const handleGenerate = async () => {
    if (!schedule || isLocked) return
    if (
      shifts.length > 0
      && !confirm('Replace the current shifts with a generated draft for this week?')
    ) {
      return
    }
    setSaving(true)
    setPublishIssues([])
    setError('')
    try {
      const result = await generateSchedule(schedule.id, { replace_existing: true })
      if (result.warnings.length > 0) {
        setPublishIssues(
          result.warnings.map((message) => ({
            level: 'warning' as const,
            code: 'generate',
            message,
          })),
        )
      }
      await load()
    } catch (err) {
      const data = (err as { response?: { data?: { explanations?: string[]; detail?: string } } })
        .response?.data
      const explanations = data?.explanations
      if (explanations?.length) {
        setPublishIssues(
          explanations.map((message) => ({
            level: 'error' as const,
            code: 'generate',
            message,
          })),
        )
        setError(data?.detail || explanations[0])
      } else {
        setError(getApiDetail(err, 'Could not generate a timetable for this week.'))
      }
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!schedule) return
    setSaving(true)
    setPublishIssues([])
    setError('')
    try {
      const report = await validateSchedule(schedule.id)
      setPublishIssues(report.issues)
      if (!report.can_publish) {
        setError(report.issues[0]?.message || 'This week cannot be published yet.')
        return
      }
      if (!confirm('Publish this week? Assigned employees will be notified.')) return
      await publishSchedule(schedule.id)
      await load()
    } catch (err) {
      setError(getApiDetail(err, 'Could not publish this week.'))
    } finally {
      setSaving(false)
    }
  }

  const handleRevise = async () => {
    if (!schedule) return
    setSaving(true)
    try {
      await reviseSchedule(schedule.id)
      await load()
    } catch (err) {
      setError(getApiDetail(err, 'Could not create a new revision.'))
    } finally {
      setSaving(false)
    }
  }

  const openHistory = async () => {
    if (!schedule) return
    setFormError('')
    try {
      const rows = await fetchScheduleRevisions(schedule.id)
      setRevisions(rows)
      setHistoryOpen(true)
    } catch (err) {
      setError(getApiDetail(err, 'Could not load schedule history.'))
    }
  }

  return (
    <DashboardLayout title="Schedule">
      <PageHeader
        title="Schedule"
        description="Plan weekly shifts for employees in your department."
      >
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-900">
          <button
            type="button"
            className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="flex items-center gap-2 px-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            <CalendarDays className="h-4 w-4 text-emerald-600" />
            {formatWeekRange(weekStart)}
          </span>
          <button
            type="button"
            className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setWeekStart(startOfWeekMonday())}>
          This week
        </Button>
        {canCreate && (
          <Button variant="secondary" size="sm" onClick={() => { setFormError(''); setTemplateModal(true) }}>
            <Settings2 className="h-4 w-4" />
            Templates
          </Button>
        )}
        {schedule && (
          <Button variant="secondary" size="sm" onClick={openHistory}>
            <History className="h-4 w-4" />
            History
          </Button>
        )}
        {isLocked && canCreate && (
          <Button variant="secondary" size="sm" onClick={handleRevise} disabled={saving}>
            New revision
          </Button>
        )}
        {canPublish && (
          <Button size="sm" onClick={handlePublish} disabled={saving}>
            <Send className="h-4 w-4" />
            Publish
          </Button>
        )}
        {canEditShifts && (
          <Button variant="secondary" size="sm" onClick={handleGenerate} disabled={saving}>
            <Sparkles className="h-4 w-4" />
            Generate week
          </Button>
        )}
        {canEditShifts && (
          <Button size="sm" onClick={() => openCreateShift()}>
            <Plus className="h-4 w-4" />
            Add shift
          </Button>
        )}
      </PageHeader>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        {departments.length > 1 && (
          <div className="sm:w-64">
            <Select
              options={departments.map((department) => ({
                value: department.id,
                label: department.name,
              }))}
              value={departmentId}
              onChange={(event) => setDepartmentId(event.target.value)}
            />
          </div>
        )}
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search employees..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
        {schedule?.status === 'published' && (
          <Badge variant="success">Published v{schedule.version}</Badge>
        )}
        {schedule && schedule.status !== 'published' && (
          <Badge variant="warning">Draft v{schedule.version}</Badge>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </div>
      )}
      {publishIssues.length > 0 && (
        <ul className="mb-4 space-y-1 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
          {publishIssues.map((issue) => (
            <li key={`${issue.code}-${issue.shift_id || issue.message}`}>
              {issue.level === 'error' ? 'Cannot publish: ' : 'Warning: '}
              {issue.message}
            </li>
          ))}
        </ul>
      )}

      {loading ? (
        <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : visibleEmployees.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            No employees available to schedule.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Department heads can only plan shifts for people in their own department.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div
            className="min-w-[960px] divide-y divide-slate-100 dark:divide-slate-800"
            style={{ display: 'grid' }}
          >
            <div
              className="grid bg-slate-50/80 dark:bg-slate-800/40"
              style={{ gridTemplateColumns: '220px repeat(7, minmax(130px, 1fr))' }}
            >
              <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Employee
              </div>
              {days.map((day) => (
                <div
                  key={day.iso}
                  className={cn(
                    'px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400',
                    day.isToday && 'text-emerald-600',
                  )}
                >
                  {day.weekday}
                  <div className="mt-0.5 text-[11px] font-medium normal-case text-slate-500">
                    {day.date}
                  </div>
                </div>
              ))}
            </div>
            {visibleEmployees.map((employee) => {
              const weeklyHours = days.reduce((total, day) => {
                const items = shiftsByEmployeeDate.get(`${employee.id}:${day.iso}`) ?? []
                return (
                  total +
                  items.reduce(
                    (sum, shift) =>
                      sum + shiftHours(shift.starts_at, shift.ends_at, shift.break_minutes),
                    0,
                  )
                )
              }, 0)
              return (
                <div
                  key={employee.id}
                  className="grid"
                  style={{ gridTemplateColumns: '220px repeat(7, minmax(130px, 1fr))' }}
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                      {initials(employee.full_name)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                        {employee.full_name}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {employee.position_name || 'Employee'} · {weeklyHours.toFixed(0)}h
                      </p>
                    </div>
                  </div>
                  {days.map((day) => {
                    const items = shiftsByEmployeeDate.get(`${employee.id}:${day.iso}`) ?? []
                    const block = cellBlock(employee, day.iso)
                    return (
                      <div
                        key={`${employee.id}-${day.iso}`}
                        className={cn(
                          'min-h-[88px] border-l border-slate-100 p-2 dark:border-slate-800',
                          block?.kind === 'leave' && 'bg-rose-50/70 dark:bg-rose-950/20',
                          block?.kind === 'unavailable' && 'bg-slate-50 dark:bg-slate-800/40',
                          block?.kind === 'pending' && 'bg-amber-50/60 dark:bg-amber-950/20',
                        )}
                      >
                        <div className="flex flex-col gap-2">
                          {block && (
                            <p
                              className={cn(
                                'rounded px-1.5 py-0.5 text-[10px] font-medium',
                                block.kind === 'leave' && 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',
                                block.kind === 'unavailable' && 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
                                block.kind === 'pending' && 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
                              )}
                            >
                              {block.label}
                            </p>
                          )}
                          {items.map((shift) => {
                            const understaffed =
                              Boolean(shift.template) &&
                              (templates.find((item) => item.id === shift.template)?.min_staff ?? 1) >
                                shift.assignments.length
                            return (
                              <button
                                key={shift.id}
                                type="button"
                                onClick={() =>
                                  canEditShifts
                                    ? openEditShift(shift, employee.id)
                                    : undefined
                                }
                                className="rounded-lg px-2 py-1.5 text-left transition hover:brightness-95"
                                style={chipStyle(shift.color)}
                              >
                                <p className="text-[11px] font-semibold leading-tight">
                                  {formatShiftTime(shift.starts_at)} – {formatShiftTime(shift.ends_at)}
                                </p>
                                <p className="truncate text-[10px] opacity-80">
                                  {shift.position_name ||
                                    employee.position_name ||
                                    shift.template_name ||
                                    'Shift'}
                                </p>
                                <p className="mt-0.5 flex items-center gap-1 text-[10px] opacity-70">
                                  <Clock3 className="h-3 w-3" />
                                  {shift.break_minutes}m break
                                  {understaffed && (
                                    <span className="ml-1 rounded bg-amber-500/20 px-1 text-amber-700">
                                      short
                                    </span>
                                  )}
                                </p>
                              </button>
                            )
                          })}
                          {canEditShifts && block?.kind !== 'leave' && block?.kind !== 'unavailable' && (
                            <button
                              type="button"
                              onClick={() => openCreateShift(employee.id, day.iso)}
                              className="flex h-7 items-center justify-center rounded-lg text-slate-300 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30"
                              aria-label={`Add shift for ${employee.full_name} on ${day.iso}`}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <Modal
        open={shiftModal}
        onClose={() => setShiftModal(false)}
        title={editingShift ? 'Edit shift' : 'Add shift'}
        size="md"
      >
        {formError && <p className="mb-3 text-sm text-red-600">{formError}</p>}
        <div className="grid gap-4">
          <Select
            label="Employee"
            value={shiftForm.employee}
            onChange={(event) => setShiftForm({ ...shiftForm, employee: event.target.value })}
            options={visibleEmployees.map((employee) => ({
              value: employee.id,
              label: employee.full_name,
            }))}
          />
          <Input
            label="Date"
            type="date"
            value={shiftForm.date}
            onChange={(event) => setShiftForm({ ...shiftForm, date: event.target.value })}
          />
          <Select
            label="Template"
            placeholder="Custom hours"
            value={shiftForm.template}
            onChange={(event) => applyTemplate(event.target.value)}
            options={templates.map((template) => ({
              value: template.id,
              label: `${template.name} (${toTimeInput(template.start_time)}–${toTimeInput(template.end_time)})`,
            }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start"
              type="time"
              value={shiftForm.start_time}
              onChange={(event) => setShiftForm({ ...shiftForm, start_time: event.target.value })}
            />
            <Input
              label="End"
              type="time"
              value={shiftForm.end_time}
              onChange={(event) => setShiftForm({ ...shiftForm, end_time: event.target.value })}
            />
          </div>
          <Input
            label="Break (minutes)"
            type="number"
            min={0}
            value={shiftForm.break_minutes}
            onChange={(event) => setShiftForm({ ...shiftForm, break_minutes: event.target.value })}
          />
          <Input
            label="Notes"
            value={shiftForm.notes}
            onChange={(event) => setShiftForm({ ...shiftForm, notes: event.target.value })}
          />
        </div>
        <div className="mt-6 flex items-center justify-between gap-2">
          {editingShift && canDelete ? (
            <Button variant="danger" onClick={removeShift} disabled={saving}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShiftModal(false)}>Cancel</Button>
            <Button onClick={saveShift} disabled={saving || !shiftForm.employee}>
              {saving ? 'Saving...' : 'Save shift'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={templateModal}
        onClose={() => setTemplateModal(false)}
        title="Shift templates"
        size="lg"
      >
        {formError && <p className="mb-3 text-sm text-red-600">{formError}</p>}
        <div className="mb-5 space-y-2">
          {templates.length === 0 && (
            <p className="text-sm text-slate-500">No templates yet. Create morning, night, or custom blocks.</p>
          )}
          {templates.map((template) => (
            <div
              key={template.id}
              className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2 dark:border-slate-800"
            >
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: template.color }} />
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{template.name}</p>
                  <p className="text-xs text-slate-500">
                    {toTimeInput(template.start_time)} – {toTimeInput(template.end_time)}
                    {template.is_overnight ? ' · overnight' : ''} · {template.break_minutes}m break
                  </p>
                </div>
              </div>
              {canDelete && (
                <Button variant="ghost" size="sm" onClick={() => removeTemplate(template)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              )}
            </div>
          ))}
        </div>
        <div className="grid gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">New template</p>
          <Input
            label="Name"
            value={templateForm.name}
            onChange={(event) => setTemplateForm({ ...templateForm, name: event.target.value })}
            placeholder="Morning cashier"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start"
              type="time"
              value={templateForm.start_time}
              onChange={(event) => setTemplateForm({ ...templateForm, start_time: event.target.value })}
            />
            <Input
              label="End"
              type="time"
              value={templateForm.end_time}
              onChange={(event) => setTemplateForm({ ...templateForm, end_time: event.target.value })}
            />
          </div>
          <Input
            label="Break (minutes)"
            type="number"
            min={0}
            value={templateForm.break_minutes}
            onChange={(event) => setTemplateForm({ ...templateForm, break_minutes: event.target.value })}
          />
          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">Color</p>
            <div className="flex flex-wrap gap-2">
              {TEMPLATE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setTemplateForm({ ...templateForm, color })}
                  className={cn(
                    'h-7 w-7 rounded-full border-2',
                    templateForm.color === color ? 'border-slate-900 dark:border-white' : 'border-transparent',
                  )}
                  style={{ backgroundColor: color }}
                  aria-label={color}
                />
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={templateForm.is_overnight || templateForm.end_time <= templateForm.start_time}
              onChange={(event) => setTemplateForm({ ...templateForm, is_overnight: event.target.checked })}
            />
            Overnight shift
          </label>
          <Button onClick={saveTemplate} disabled={saving || !templateForm.name}>
            {saving ? 'Saving...' : 'Save template'}
          </Button>
        </div>
      </Modal>

      <Modal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title="Schedule history"
        size="lg"
      >
        {revisions.length === 0 ? (
          <p className="text-sm text-slate-500">No published versions yet.</p>
        ) : (
          <div className="space-y-3">
            {revisions.map((revision) => (
              <div
                key={revision.id}
                className="rounded-xl border border-slate-100 px-4 py-3 dark:border-slate-800"
              >
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  Version {revision.version} · {revision.note || 'Snapshot'}
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(revision.created_at).toLocaleString('en-GB')}
                  {revision.created_by_name ? ` · ${revision.created_by_name}` : ''}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {revision.snapshot.shifts?.length ?? 0} shifts recorded
                </p>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </DashboardLayout>
  )
}

function formatWeekDays(weekStart: Date) {
  return Array.from({ length: 7 }, (_, index) => formatDayHeading(addDays(weekStart, index)))
}

function cellBlock(employee: SchedulableEmployee, iso: string) {
  const constraints = employee.constraints
  if (!constraints) return null
  const leave = constraints.leave_dates.find((item) => item.date === iso)
  if (leave) return { kind: 'leave' as const, label: leave.label }
  const unavailable = constraints.unavailable_dates.find((item) => item.date === iso)
  if (unavailable) return { kind: 'unavailable' as const, label: unavailable.label }
  const pending = constraints.pending_leave_dates.find((item) => item.date === iso)
  if (pending) return { kind: 'pending' as const, label: `Pending: ${pending.label}` }
  return null
}
