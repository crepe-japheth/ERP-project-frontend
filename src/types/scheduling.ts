export type ScheduleStatus = 'draft' | 'in_review' | 'published' | 'archived'

export interface ShiftAssignment {
  id: string
  shift: string
  employee: string
  employee_name: string
  employee_number: string
  position_name: string
  assigned_by: string | null
  created_at: string
}

export interface ShiftTemplate {
  id: string
  name: string
  code: string
  color: string
  start_time: string
  end_time: string
  break_minutes: number
  is_overnight: boolean
  is_rotating: boolean
  department: string
  department_name: string
  branch: string | null
  branch_name: string
  position: string | null
  position_name: string
  min_staff: number
  max_staff: number | null
  notes: string
  is_active: boolean
}

export interface Schedule {
  id: string
  name: string
  department: string
  department_name: string
  start_date: string
  end_date: string
  status: ScheduleStatus
  version: number
  notes: string
  published_at: string | null
  published_by: string | null
}

export interface ScheduleIssue {
  level: 'error' | 'warning'
  code: string
  message: string
  shift_id?: string
  employee_id?: string
  date?: string
}

export interface ScheduleValidation {
  can_publish: boolean
  issues: ScheduleIssue[]
  shift_count: number
}

export interface ScheduleGeneration {
  status: 'feasible' | 'infeasible'
  assigned_count: number
  shift_count: number
  explanations: string[]
  warnings: string[]
  detail?: string
  schedule: Schedule
}

export interface ScheduleRevision {
  id: string
  schedule: string
  version: number
  snapshot: {
    shifts?: {
      date: string
      starts_at: string
      ends_at: string
      assignments?: { employee_name: string }[]
    }[]
  }
  note: string
  created_by: string | null
  created_by_name: string
  created_at: string
}

export interface Shift {
  id: string
  schedule: string
  template: string | null
  template_name: string
  date: string
  starts_at: string
  ends_at: string
  break_minutes: number
  color: string
  department: string
  department_name: string
  branch: string | null
  branch_name: string
  position: string | null
  position_name: string
  notes: string
  assignments: ShiftAssignment[]
}

export interface ConstraintDate {
  date: string
  label: string
}

export interface EmployeeConstraints {
  leave_dates: ConstraintDate[]
  unavailable_dates: ConstraintDate[]
  pending_leave_dates: ConstraintDate[]
}

export interface SchedulableEmployee {
  id: string
  employee_number: string
  full_name: string
  first_name: string
  last_name: string
  department: string | null
  department_name: string
  position: string | null
  position_name: string
  constraints?: EmployeeConstraints
}

export interface EmployeeAvailability {
  id: string
  employee: string
  employee_name: string
  kind: 'unavailable' | 'preferred'
  start_date: string
  end_date: string
  start_time: string | null
  end_time: string | null
  notes: string
  created_at: string
}

export interface SchedulingPolicy {
  id: string
  name: string
  min_rest_hours: string
  max_hours_per_day: string
  max_hours_per_week: string
  is_default: boolean
}

export interface ShiftPayload {
  schedule: string
  template?: string | null
  date: string
  start_time?: string
  end_time?: string
  is_overnight?: boolean
  break_minutes?: number
  color?: string
  notes?: string
  employee_ids?: string[]
}

export interface ShiftTemplatePayload {
  name: string
  code: string
  color: string
  start_time: string
  end_time: string
  break_minutes: number
  is_overnight: boolean
  department: string
  min_staff?: number
  notes?: string
}
