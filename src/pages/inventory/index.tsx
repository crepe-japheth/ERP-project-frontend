import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { AlertsPage } from './AlertsPage'
import { CategoriesPage } from './CategoriesPage'
import { ProductsPage } from './ProductsPage'
import { PurchasesPage } from './PurchasesPage'
import { ReportsPage } from './ReportsPage'
import { StockIssuesPage } from './StockIssuesPage'
import { StockPage } from './StockPage'
import { SuppliersPage } from './SuppliersPage'

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

export function InventoryRoutes() {
  return (
    <Routes>
      <Route path="products" element={<Section permission="inventory.products.read"><ProductsPage /></Section>} />
      <Route path="categories" element={<Section permission="inventory.categories.read"><CategoriesPage /></Section>} />
      <Route path="suppliers" element={<Section permission="inventory.suppliers.read"><SuppliersPage /></Section>} />
      <Route path="purchases" element={<Section permission="inventory.purchases.read"><PurchasesPage /></Section>} />
      <Route path="issues" element={<Section permission="inventory.stock.read"><StockIssuesPage /></Section>} />
      <Route path="stock" element={<Section permission="inventory.stock.read"><StockPage /></Section>} />
      <Route path="alerts" element={<Section permission="inventory.stock.read"><AlertsPage /></Section>} />
      <Route path="reports" element={<Section permission="inventory.stock.read"><ReportsPage /></Section>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
