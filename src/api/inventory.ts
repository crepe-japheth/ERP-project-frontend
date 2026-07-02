import type {
  Category,
  PaginatedResponse,
  Product,
  StockLevel,
  Supplier,
  UnitOfMeasure,
} from '../types/inventory'
import { apiClient } from './client'

const BASE = '/inventory'

export async function fetchCategories(params?: { search?: string; page?: number }) {
  const { data } = await apiClient.get<PaginatedResponse<Category>>(`${BASE}/categories/`, { params })
  return data
}

export async function createCategory(payload: Partial<Category>) {
  const { data } = await apiClient.post<Category>(`${BASE}/categories/`, payload)
  return data
}

export async function updateCategory(id: string, payload: Partial<Category>) {
  const { data } = await apiClient.patch<Category>(`${BASE}/categories/${id}/`, payload)
  return data
}

export async function deleteCategory(id: string) {
  await apiClient.delete(`${BASE}/categories/${id}/`)
}

export async function fetchUnits(params?: { search?: string }) {
  const { data } = await apiClient.get<UnitOfMeasure[]>(`${BASE}/units/`, { params })
  return data
}

export async function createUnit(payload: Partial<UnitOfMeasure>) {
  const { data } = await apiClient.post<UnitOfMeasure>(`${BASE}/units/`, payload)
  return data
}

export async function fetchSuppliers(params?: { search?: string; page?: number; status?: string }) {
  const { data } = await apiClient.get<PaginatedResponse<Supplier>>(`${BASE}/suppliers/`, { params })
  return data
}

export async function createSupplier(payload: Partial<Supplier>) {
  const { data } = await apiClient.post<Supplier>(`${BASE}/suppliers/`, payload)
  return data
}

export async function updateSupplier(id: string, payload: Partial<Supplier>) {
  const { data } = await apiClient.patch<Supplier>(`${BASE}/suppliers/${id}/`, payload)
  return data
}

export async function deleteSupplier(id: string) {
  await apiClient.delete(`${BASE}/suppliers/${id}/`)
}

export async function fetchProducts(params?: {
  search?: string
  page?: number
  category?: string
  item_type?: string
  status?: string
}) {
  const { data } = await apiClient.get<PaginatedResponse<Product>>(`${BASE}/products/`, { params })
  return data
}

export async function createProduct(payload: Partial<Product>) {
  const { data } = await apiClient.post<Product>(`${BASE}/products/`, payload)
  return data
}

export async function updateProduct(id: string, payload: Partial<Product>) {
  const { data } = await apiClient.patch<Product>(`${BASE}/products/${id}/`, payload)
  return data
}

export async function deleteProduct(id: string) {
  await apiClient.delete(`${BASE}/products/${id}/`)
}

export async function fetchStock(params?: { search?: string; page?: number; low_stock?: boolean }) {
  const { data } = await apiClient.get<PaginatedResponse<StockLevel>>(`${BASE}/stock/`, { params })
  return data
}
