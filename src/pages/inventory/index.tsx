import { Navigate, Route, Routes } from 'react-router-dom'
import { AlertsPage } from './AlertsPage'
import { CategoriesPage } from './CategoriesPage'
import { ProductsPage } from './ProductsPage'
import { PurchasesPage } from './PurchasesPage'
import { ReportsPage } from './ReportsPage'
import { StockIssuesPage } from './StockIssuesPage'
import { StockPage } from './StockPage'
import { SuppliersPage } from './SuppliersPage'

export function InventoryRoutes() {
  return (
    <Routes>
      <Route path="products" element={<ProductsPage />} />
      <Route path="categories" element={<CategoriesPage />} />
      <Route path="suppliers" element={<SuppliersPage />} />
      <Route path="purchases" element={<PurchasesPage />} />
      <Route path="issues" element={<StockIssuesPage />} />
      <Route path="stock" element={<StockPage />} />
      <Route path="alerts" element={<AlertsPage />} />
      <Route path="reports" element={<ReportsPage />} />
      <Route path="*" element={<Navigate to="products" replace />} />
    </Routes>
  )
}
