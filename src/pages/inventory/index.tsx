import { Navigate, Route, Routes } from 'react-router-dom'
import { CategoriesPage } from './CategoriesPage'
import { ProductsPage } from './ProductsPage'
import { StockPage } from './StockPage'
import { SuppliersPage } from './SuppliersPage'
import { PlaceholderPage } from '../PlaceholderPage'

export function InventoryRoutes() {
  return (
    <Routes>
      <Route path="products" element={<ProductsPage />} />
      <Route path="categories" element={<CategoriesPage />} />
      <Route path="suppliers" element={<SuppliersPage />} />
      <Route path="stock" element={<StockPage />} />
      <Route
        path="purchases"
        element={
          <PlaceholderPage
            title="Purchases"
            description="Purchase orders and goods receiving will be available in the next phase."
          />
        }
      />
      <Route path="*" element={<Navigate to="products" replace />} />
    </Routes>
  )
}
