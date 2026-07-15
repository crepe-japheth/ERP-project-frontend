import type {
  Allowance,
  Attendance,
  Branch,
  Deduction,
  Department,
  Employee,
  EmploymentContract,
  HRSummary,
  LeaveRequest,
  LeaveType,
  PaginatedResponse,
  PayrollPeriod,
  Payslip,
  Position,
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
}) {
  const { data } = await apiClient.get<PaginatedResponse<Employee>>(`${BASE}/employees/`, { params })
  return data
}

export async function fetchEmployee(id: string) {
  const { data } = await apiClient.get<Employee>(`${BASE}/employees/${id}/`)
  return data
}

export async function createEmployee(payload: Record<string, unknown>) {
  const { data } = await apiClient.post<Employee>(`${BASE}/employees/`, payload)
  return data
}

export async function updateEmployee(id: string, payload: Record<string, unknown>) {
  const { data } = await apiClient.patch<Employee>(`${BASE}/employees/${id}/`, payload)
  return data
}

export async function deleteEmployee(id: string) {
  await apiClient.delete(`${BASE}/employees/${id}/`)
}

export async function fetchContracts(params?: { search?: string; employee?: string; status?: string; page?: number }) {
  const { data } = await apiClient.get<PaginatedResponse<EmploymentContract>>(`${BASE}/contracts/`, { params })
  return data
}

export async function createContract(payload: Partial<EmploymentContract>) {
  const { data } = await apiClient.post<EmploymentContract>(`${BASE}/contracts/`, payload)
  return data
}

export async function updateContract(id: string, payload: Partial<EmploymentContract>) {
  const { data } = await apiClient.patch<EmploymentContract>(`${BASE}/contracts/${id}/`, payload)
  return data
}

export async function deleteContract(id: string) {
  await apiClient.delete(`${BASE}/contracts/${id}/`)
}

export async function fetchAllowances(params?: { search?: string; page?: number }) {
  const { data } = await apiClient.get<PaginatedResponse<Allowance>>(`${BASE}/allowances/`, { params })
  return data
}

export async function createAllowance(payload: Record<string, unknown>) {
  const { data } = await apiClient.post<Allowance>(`${BASE}/allowances/`, payload)
  return data
}

export async function updateAllowance(id: string, payload: Record<string, unknown>) {
  const { data } = await apiClient.patch<Allowance>(`${BASE}/allowances/${id}/`, payload)
  return data
}

export async function deleteAllowance(id: string) {
  await apiClient.delete(`${BASE}/allowances/${id}/`)
}

export async function fetchDeductions(params?: { search?: string; page?: number }) {
  const { data } = await apiClient.get<PaginatedResponse<Deduction>>(`${BASE}/deductions/`, { params })
  return data
}

export async function createDeduction(payload: Record<string, unknown>) {
  const { data } = await apiClient.post<Deduction>(`${BASE}/deductions/`, payload)
  return data
}

export async function updateDeduction(id: string, payload: Record<string, unknown>) {
  const { data } = await apiClient.patch<Deduction>(`${BASE}/deductions/${id}/`, payload)
  return data
}

export async function deleteDeduction(id: string) {
  await apiClient.delete(`${BASE}/deductions/${id}/`)
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

export async function generatePayroll(periodId: string, excludeEmployeeIds: string[] = []) {
  const { data } = await apiClient.post<PayrollPeriod>(`${BASE}/payroll/periods/${periodId}/generate/`, {
    exclude_employee_ids: excludeEmployeeIds,
  })
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
