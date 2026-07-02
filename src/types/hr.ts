import type { PaginatedResponse } from './inventory'

export interface HRSummary {
  total_employees: number
  departments: number
  pending_leave: number
  open_payroll_periods: number
  today_present: number
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
  employee_count: number
  is_active: boolean
  created_at: string
  updated_at: string
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

export interface Employee {
  id: string
  employee_number: string
  full_name: string
  first_name: string
  last_name: string
  national_id: string
  passport: string
  photo: string | null
  gender: string
  date_of_birth: string | null
  nationality: string
  phone: string
  email: string
  address: string
  emergency_contact_name: string
  emergency_contact_phone: string
  hire_date: string | null
  employment_status: string
  department: string | null
  department_name: string
  position: string | null
  position_name: string
  supervisor: string | null
  supervisor_name: string
  branch: string | null
  branch_name: string
  contract_type: string
  salary_type: string
  user: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface Attendance {
  id: string
  employee: string
  employee_name: string
  employee_number: string
  date: string
  clock_in: string | null
  clock_out: string | null
  status: string
  working_hours: string
  late_minutes: number
  early_leave_minutes: number
  overtime_hours: string
  notes: string
  created_at: string
}

export interface LeaveType {
  id: string
  name: string
  code: string
  days_per_year: number
  is_paid: boolean
  description: string
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
  approved_by: string | null
  approved_by_name: string
  approved_at: string | null
  rejection_reason: string
  created_at: string
}

export interface PayrollPeriod {
  id: string
  name: string
  period_type: string
  start_date: string
  end_date: string
  status: string
  notes: string
  created_at: string
}

export interface SalaryComponent {
  id: string
  name: string
  code: string
  component_type: string
  is_taxable: boolean
  is_fixed: boolean
  description: string
}

export interface DeductionRule {
  id: string
  name: string
  code: string
  calculation_type: string
  value: string
  is_statutory: boolean
  description: string
}

export interface EmployeeCompensation {
  id: string
  employee: string
  employee_name: string
  employee_number: string
  basic_salary: string
  housing_allowance: string
  transport_allowance: string
  communication_allowance: string
  other_allowances: string
  gross_salary: string
  effective_from: string | null
  notes: string
}

export interface EmployeeLoan {
  id: string
  employee: string
  employee_name: string
  employee_number: string
  reference: string
  principal_amount: string
  interest_rate: string
  monthly_deduction: string
  balance: string
  start_date: string
  end_date: string | null
  status: string
  notes: string
}

export interface SalaryAdvance {
  id: string
  employee: string
  employee_name: string
  employee_number: string
  reference: string
  amount: string
  recovery_months: number
  monthly_recovery: string
  balance: string
  advance_date: string
  status: string
  notes: string
}

export interface OvertimeEntry {
  id: string
  employee: string
  employee_name: string
  employee_number: string
  date: string
  hours: string
  rate: string
  total: string
  payroll_period: string | null
  notes: string
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
  overtime_hours: string
  overtime_amount?: string
  lines?: PayslipLine[]
  created_at: string
}

export interface PayrollSummaryReport {
  period: string
  period_id: string
  status: string
  employee_count: number
  total_gross: string
  total_deductions: string
  total_net: string
  total_overtime: string
  by_department: { department: string; employees: number; gross: string; net: string }[]
}

export type { PaginatedResponse }
