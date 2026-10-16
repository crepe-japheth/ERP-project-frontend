export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface HRSummary {
  total_employees: number
  departments: number
  pending_leave: number
  open_payroll_periods: number
  today_present: number
  paid_this_month: string
  active_contracts: number
  upcoming_birthdays: UpcomingBirthday[]
  department_distribution: {
    department: string
    employee_count: number
  }[]
}

export interface UpcomingBirthday {
  employee_id: string
  employee_number: string
  full_name: string
  date_of_birth: string
  next_birthday: string
  days_until: number
  department: string
}

export interface Branch {
  id: string
  name: string
  code: string
  location: string
  phone: string
  is_active: boolean
}

export interface Department {
  id: string
  name: string
  code: string
  description: string
  head: string | null
  head_name: string
  employee_count: number
  is_active: boolean
}

export interface Position {
  id: string
  name: string
  code: string
  description: string
  department: string | null
  department_name: string
  is_active: boolean
}

export type ContractOptionCategory =
  | 'work_type'
  | 'shift'
  | 'wage_type'
  | 'payment_frequency'

export interface ContractOption {
  id: string
  category: ContractOptionCategory
  category_display: string
  name: string
  code: string
  description: string
  is_active: boolean
}

export interface AttendancePolicy {
  id: string
  name: string
  work_start_time: string
  work_end_time: string
  break_minutes: number
  late_grace_minutes: number
  scheduled_hours: string
  is_default: boolean
  is_active: boolean
}

export interface EmergencyContact {
  id?: string
  name: string
  relationship: string
  phone: string
}

export interface EmployeeDocument {
  id?: string
  name: string
  attachment?: string | null
}

export interface Employee {
  id: string
  employee_number: string
  badge_id: string
  badge_display?: string
  full_name: string
  first_name: string
  middle_name: string
  last_name: string
  national_id?: string
  passport?: string
  photo?: string | null
  gender: string
  date_of_birth: string | null
  nationality?: string
  country: string
  city: string
  phone: string
  email: string
  address: string
  qualification: string
  experience: string
  marital_status: string
  hire_date: string | null
  employment_status: string
  department: string | null
  department_name: string
  position: string | null
  position_name: string
  job_role: string
  work_location: string
  supervisor: string | null
  supervisor_name?: string
  branch: string | null
  bank_name: string
  bank_account: string
  bank_account_holder: string
  emergency_contacts?: EmergencyContact[]
  documents?: EmployeeDocument[]
  is_active: boolean
}

export interface EmploymentContract {
  id: string
  name: string
  employee: string
  employee_name: string
  employee_number: string
  position: string | null
  position_name: string
  department: string | null
  department_name: string
  shift: string
  work_type: string
  start_date: string
  end_date: string | null
  is_infinite: boolean
  wage_type: string
  basic_salary: string
  payment_frequency: string
  status: string
  attachment: string | null
  is_active: boolean
}

export interface Allowance {
  id: string
  title: string
  apply_every_payroll: boolean
  one_time_date: string | null
  include_all_active: boolean
  is_taxable: boolean
  is_fixed: boolean
  is_condition_based: boolean
  amount: string
  condition_field: string
  condition_operator: string
  condition_value: string
  employee_ids: string[]
  employee_names: string[]
  is_active: boolean
}

export interface Deduction {
  id: string
  title: string
  apply_every_payroll: boolean
  one_time_date: string | null
  include_all_active: boolean
  is_tax: boolean
  is_pretax: boolean
  is_fixed: boolean
  is_condition_based: boolean
  amount: string
  condition_field: string
  condition_operator: string
  condition_value: string
  employee_ids: string[]
  employee_names: string[]
  is_active: boolean
}

export interface Attendance {
  id: string
  employee: string
  employee_name: string
  employee_number: string
  date: string
  day: string
  clock_in: string | null
  clock_out: string | null
  status: string
  working_hours: string
  hours_worked: string
  notes: string
}

export interface AttendancePayload {
  employee: string
  date: string
  clock_in: string | null
  clock_out: string | null
  status: string
  working_hours?: string
  notes?: string
}

export interface LeaveType {
  id: string
  name: string
  code: string
  days_per_year: number
  is_paid: boolean
  description?: string
  is_active?: boolean
}

export interface LeaveRequest {
  id: string
  employee: string
  employee_name: string
  employee_number: string
  leave_type: string
  leave_type_name: string
  start_date: string
  end_date: string
  days: string
  reason: string
  status: string
}

export interface PayrollPeriod {
  id: string
  name: string
  period_type: string
  start_date: string
  end_date: string
  status: string
  notes: string
  total_pay: string
  total_deductions: string
  gross_pay: string
  excluded_employee_ids: string[]
  payslip_count: number
}

export interface PayslipLine {
  id: string
  code: string
  description: string
  line_type: string
  amount: string
}

export interface Payslip {
  id: string
  payroll_period: string
  period_name: string
  employee: string
  employee_name: string
  employee_number: string
  gross_pay: string
  total_earnings?: string
  total_deductions: string
  net_pay: string
  lines?: PayslipLine[]
  created_at: string
}

export const CONDITION_FIELDS = [
  { value: 'basic_pay', label: 'Basic Pay' },
  { value: 'gender', label: 'Gender' },
  { value: 'experience', label: 'Experience' },
  { value: 'age', label: 'Age' },
  { value: 'marital_status', label: 'Marital Status' },
  { value: 'department', label: 'Department' },
  { value: 'position', label: 'Position' },
]

export const CONDITION_OPERATORS = [
  { value: 'eq', label: 'Equal (==)' },
  { value: 'ne', label: 'Not Equal (!=)' },
  { value: 'gt', label: 'Greater (>)' },
  { value: 'gte', label: 'Greater or Equal (>=)' },
  { value: 'lt', label: 'Less (<)' },
  { value: 'lte', label: 'Less or Equal (<=)' },
]
