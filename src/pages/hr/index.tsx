import { Navigate, Route, Routes } from 'react-router-dom'
import { AllowancesPage } from './AllowancesPage'
import { AttendancePage } from './AttendancePage'
import { ContractsPage } from './ContractsPage'
import { DeductionsPage } from './DeductionsPage'
import { DepartmentsPage } from './DepartmentsPage'
import { EmployeesPage } from './EmployeesPage'
import { LeavePage } from './LeavePage'
import { PayrollPage } from './PayrollPage'
import { PayslipsPage } from './PayslipsPage'

export function HRRoutes() {
  return (
    <Routes>
      <Route path="employees" element={<EmployeesPage />} />
      <Route path="departments" element={<DepartmentsPage />} />
      <Route path="contracts" element={<ContractsPage />} />
      <Route path="allowances" element={<AllowancesPage />} />
      <Route path="deductions" element={<DeductionsPage />} />
      <Route path="attendance" element={<AttendancePage />} />
      <Route path="leave" element={<LeavePage />} />
      <Route path="payroll" element={<PayrollPage />} />
      <Route path="payslips" element={<PayslipsPage />} />
      <Route path="*" element={<Navigate to="employees" replace />} />
    </Routes>
  )
}
