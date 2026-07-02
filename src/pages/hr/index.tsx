import { Navigate, Route, Routes } from 'react-router-dom'
import { AttendancePage } from './AttendancePage'
import { DepartmentsPage } from './DepartmentsPage'
import { EmployeesPage } from './EmployeesPage'
import { LeavePage } from './LeavePage'
import { PayrollPage } from './PayrollPage'

export function HRRoutes() {
  return (
    <Routes>
      <Route path="employees" element={<EmployeesPage />} />
      <Route path="departments" element={<DepartmentsPage />} />
      <Route path="attendance" element={<AttendancePage />} />
      <Route path="leave" element={<LeavePage />} />
      <Route path="payroll" element={<PayrollPage />} />
      <Route path="*" element={<Navigate to="employees" replace />} />
    </Routes>
  )
}
