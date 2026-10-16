import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { AllowancesPage } from './AllowancesPage'
import { AttendancePage } from './AttendancePage'
import { ContractsPage } from './ContractsPage'
import { DeductionsPage } from './DeductionsPage'
import { DepartmentsPage } from './DepartmentsPage'
import { EmployeesPage } from './EmployeesPage'
import { HRDashboardPage } from './HRDashboardPage'
import { LeavePage } from './LeavePage'
import { PayrollPage } from './PayrollPage'
import { PayslipsPage } from './PayslipsPage'
import { SchedulePage } from './SchedulePage'

function Section({
  permission,
  children,
}: {
  permission: string
  children: React.ReactNode
}) {
  const { user, hasPermission } = useAuth()
  if (!user?.is_superuser && !hasPermission(permission)) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

export function HRRoutes() {
  return (
    <Routes>
      <Route path="dashboard" element={<HRDashboardPage />} />
      <Route path="employees" element={<Section permission="hr.employees.read"><EmployeesPage /></Section>} />
      <Route path="departments" element={<Section permission="hr.departments.read"><DepartmentsPage /></Section>} />
      <Route path="contracts" element={<Section permission="hr.contracts.read"><ContractsPage /></Section>} />
      <Route path="allowances" element={<Section permission="hr.payroll.read"><AllowancesPage /></Section>} />
      <Route path="deductions" element={<Section permission="hr.payroll.read"><DeductionsPage /></Section>} />
      <Route path="attendance" element={<Section permission="hr.attendance.read"><AttendancePage /></Section>} />
      <Route path="schedule" element={<Section permission="hr.schedule.read"><SchedulePage /></Section>} />
      <Route path="leave" element={<Section permission="hr.leave.read"><LeavePage /></Section>} />
      <Route path="payroll" element={<Section permission="hr.payroll.read"><PayrollPage /></Section>} />
      <Route path="payslips" element={<Section permission="hr.payroll.read"><PayslipsPage /></Section>} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  )
}
