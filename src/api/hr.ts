import type {
  Attendance,
  Branch,
  DeductionRule,
  Department,
  Employee,
  EmployeeCompensation,
  EmployeeLoan,
  HRSummary,
  LeaveRequest,
  LeaveType,
  OvertimeEntry,
  PaginatedResponse,
  PayrollPeriod,
  PayrollSummaryReport,
  Payslip,
  Position,
  SalaryAdvance,
  SalaryComponent,
} from '../types/hr'
import { apiClient } from './client'

const BASE = '/hr'

export async function fetchHRSummary() {
  const { data } = await apiClient.get<HRSummary>(`${BASE}/summary/`)
  return data
}

export async function fetchBranches(params?: { search?: string }) {
  const { data } = await apiClient.get<Branch[]>(`${BASE}/branches/`, { params })
  return data
}

export async function fetchDepartments(params?: { search?: string; page?: number }) {
  const { data } = await apiClient.get<PaginatedResponse<Department>>(`${BASE}/departments/`, { params })
  return data
}

export async function createDepartment(payload: Partial<Department>) {
  const { data } = await apiClient.post<Department>(`${BASE}/departments/`, payload)
  return data
}

export async function updateDepartment(id: string, payload: Partial<Department>) {
  const { data } = await apiClient.patch<Department>(`${BASE}/departments/${id}/`, payload)
  return data
}

export async function deleteDepartment(id: string) {
  await apiClient.delete(`${BASE}/departments/${id}/`)
}

export async function fetchPositions(params?: { search?: string; department?: string }) {
  const { data } = await apiClient.get<Position[]>(`${BASE}/positions/`, { params })
  return data
}

export async function createPosition(payload: Partial<Position>) {
  const { data } = await apiClient.post<Position>(`${BASE}/positions/`, payload)
  return data
}

export async function updatePosition(id: string, payload: Partial<Position>) {
  const { data } = await apiClient.patch<Position>(`${BASE}/positions/${id}/`, payload)
  return data
}

export async function deletePosition(id: string) {
  await apiClient.delete(`${BASE}/positions/${id}/`)
}

export async function fetchEmployees(params?: {
  search?: string
  page?: number
  department?: string
  status?: string
  branch?: string
}) {
  const { data } = await apiClient.get<PaginatedResponse<Employee>>(`${BASE}/employees/`, { params })
  return data
}

export async function fetchEmployee(id: string) {
  const { data } = await apiClient.get<Employee>(`${BASE}/employees/${id}/`)
  return data
}

export async function createEmployee(payload: Partial<Employee>) {
  const { data } = await apiClient.post<Employee>(`${BASE}/employees/`, payload)
  return data
}

export async function updateEmployee(id: string, payload: Partial<Employee>) {
  const { data } = await apiClient.patch<Employee>(`${BASE}/employees/${id}/`, payload)
  return data
}

export async function deleteEmployee(id: string) {
  await apiClient.delete(`${BASE}/employees/${id}/`)
}

export async function fetchAttendance(params?: {
  search?: string
  page?: number
  date_from?: string
  date_to?: string
  employee?: string
}) {
  const { data } = await apiClient.get<PaginatedResponse<Attendance>>(`${BASE}/attendance/`, { params })
  return data
}

export async function createAttendance(payload: Partial<Attendance>) {
  const { data } = await apiClient.post<Attendance>(`${BASE}/attendance/`, payload)
  return data
}

export async function clockIn(employeeId: string, notes?: string) {
  const { data } = await apiClient.post<Attendance>(`${BASE}/attendance/clock-in/`, {
    employee: employeeId,
    notes,
  })
  return data
}

export async function clockOut(employeeId: string, notes?: string) {
  const { data } = await apiClient.post<Attendance>(`${BASE}/attendance/clock-out/`, {
    employee: employeeId,
    notes,
  })
  return data
}

export async function fetchLeaveTypes() {
  const { data } = await apiClient.get<LeaveType[]>(`${BASE}/leave-types/`)
  return data
}

export async function fetchLeaveRequests(params?: {
  search?: string
  page?: number
  status?: string
  employee?: string
}) {
  const { data } = await apiClient.get<PaginatedResponse<LeaveRequest>>(`${BASE}/leave-requests/`, { params })
  return data
}

export async function createLeaveRequest(payload: Partial<LeaveRequest>) {
  const { data } = await apiClient.post<LeaveRequest>(`${BASE}/leave-requests/`, payload)
  return data
}

export async function submitLeaveRequest(id: string) {
  const { data } = await apiClient.post<LeaveRequest>(`${BASE}/leave-requests/${id}/submit/`)
  return data
}

export async function approveLeaveRequest(id: string) {
  const { data } = await apiClient.post<LeaveRequest>(`${BASE}/leave-requests/${id}/approve/`)
  return data
}

export async function rejectLeaveRequest(id: string, reason?: string) {
  const { data } = await apiClient.post<LeaveRequest>(`${BASE}/leave-requests/${id}/reject/`, { reason })
  return data
}

export async function cancelLeaveRequest(id: string) {
  const { data } = await apiClient.post<LeaveRequest>(`${BASE}/leave-requests/${id}/cancel/`)
  return data
}

export async function fetchPayrollPeriods(params?: { status?: string; page?: number }) {
  const { data } = await apiClient.get<PaginatedResponse<PayrollPeriod>>(`${BASE}/payroll/periods/`, { params })
  return data
}

export async function createPayrollPeriod(payload: Partial<PayrollPeriod>) {
  const { data } = await apiClient.post<PayrollPeriod>(`${BASE}/payroll/periods/`, payload)
  return data
}

export async function advancePayrollPeriod(id: string) {
  const { data } = await apiClient.post<PayrollPeriod>(`${BASE}/payroll/periods/${id}/advance/`)
  return data
}

export async function fetchSalaryComponents() {
  const { data } = await apiClient.get<SalaryComponent[]>(`${BASE}/payroll/components/`)
  return data
}

export async function fetchDeductionRules() {
  const { data } = await apiClient.get<DeductionRule[]>(`${BASE}/payroll/deduction-rules/`)
  return data
}

export async function fetchCompensations(params?: { search?: string; page?: number }) {
  const { data } = await apiClient.get<PaginatedResponse<EmployeeCompensation>>(
    `${BASE}/payroll/compensation/`,
    { params },
  )
  return data
}

export async function updateCompensation(employeeId: string, payload: Partial<EmployeeCompensation>) {
  const { data } = await apiClient.patch<EmployeeCompensation>(
    `${BASE}/payroll/compensation/${employeeId}/`,
    payload,
  )
  return data
}

export async function generatePayroll(periodId: string) {
  const { data } = await apiClient.post<PayrollPeriod>(`${BASE}/payroll/periods/${periodId}/generate/`)
  return data
}

export async function fetchPayslips(params?: { period?: string; employee?: string; search?: string; page?: number }) {
  const { data } = await apiClient.get<PaginatedResponse<Payslip>>(`${BASE}/payroll/payslips/`, { params })
  return data
}

export async function fetchPayslip(id: string) {
  const { data } = await apiClient.get<Payslip>(`${BASE}/payroll/payslips/${id}/`)
  return data
}

export async function fetchLoans(params?: { search?: string; employee?: string; status?: string; page?: number }) {
  const { data } = await apiClient.get<PaginatedResponse<EmployeeLoan>>(`${BASE}/payroll/loans/`, { params })
  return data
}

export async function createLoan(payload: Partial<EmployeeLoan>) {
  const { data } = await apiClient.post<EmployeeLoan>(`${BASE}/payroll/loans/`, payload)
  return data
}

export async function fetchAdvances(params?: { search?: string; employee?: string; status?: string; page?: number }) {
  const { data } = await apiClient.get<PaginatedResponse<SalaryAdvance>>(`${BASE}/payroll/advances/`, { params })
  return data
}

export async function createAdvance(payload: Partial<SalaryAdvance>) {
  const { data } = await apiClient.post<SalaryAdvance>(`${BASE}/payroll/advances/`, payload)
  return data
}

export async function createOvertime(payload: Partial<OvertimeEntry>) {
  const { data } = await apiClient.post<OvertimeEntry>(`${BASE}/payroll/overtime/`, payload)
  return data
}

export async function fetchPayrollSummary(periodId: string) {
  const { data } = await apiClient.get<PayrollSummaryReport>(`${BASE}/payroll/reports/summary/${periodId}/`)
  return data
}

export async function fetchBankTransferReport(periodId: string) {
  const { data } = await apiClient.get<Record<string, string>[]>(`${BASE}/payroll/reports/bank-transfer/${periodId}/`)
  return data
}

export async function fetchTaxReport(periodId: string) {
  const { data } = await apiClient.get<Record<string, string>[]>(`${BASE}/payroll/reports/tax/${periodId}/`)
  return data
}

export async function fetchDeductionReport(periodId: string) {
  const { data } = await apiClient.get<Record<string, string>[]>(`${BASE}/payroll/reports/deductions/${periodId}/`)
  return data
}

export async function fetchAllowanceReport(periodId: string) {
  const { data } = await apiClient.get<Record<string, string>[]>(`${BASE}/payroll/reports/allowances/${periodId}/`)
  return data
}

export async function fetchEmployeeCostReport(periodId: string) {
  const { data } = await apiClient.get<Record<string, string>[]>(`${BASE}/payroll/reports/employee-cost/${periodId}/`)
  return data
}
