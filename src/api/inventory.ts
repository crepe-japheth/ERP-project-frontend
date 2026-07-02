import type {
  AlertSummary,
  Category,
  ExpiredItemRow,
  PaginatedResponse,
  Product,
  Purchase,
  PurchaseListItem,
  ReorderReportRow,
  StockAdjustment,
  StockAlert,
  StockIssue,
  StockIssueItem,
  StockIssueListItem,
  StockLevel,
  StockMovement,
  StockReportRow,
  Supplier,
  UnitOfMeasure,
  ValuationReport,
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

export async function fetchPurchases(params?: { search?: string; status?: string; page?: number }) {
  const { data } = await apiClient.get<PaginatedResponse<PurchaseListItem>>(`${BASE}/purchases/`, { params })
  return data
}

export async function fetchPurchase(id: string) {
  const { data } = await apiClient.get<Purchase>(`${BASE}/purchases/${id}/`)
  return data
}

export async function createPurchase(payload: object) {
  const { data } = await apiClient.post<Purchase>(`${BASE}/purchases/`, payload)
  return data
}

export async function approvePurchase(id: string) {
  const { data } = await apiClient.post<Purchase>(`${BASE}/purchases/${id}/approve/`)
  return data
}

export async function receivePurchase(id: string, payload: object) {
  const { data } = await apiClient.post(`${BASE}/purchases/${id}/receive/`, payload)
  return data
}

export async function cancelPurchase(id: string) {
  await apiClient.delete(`${BASE}/purchases/${id}/`)
}

export async function fetchIssues(params?: { search?: string; status?: string }) {
  const { data } = await apiClient.get<PaginatedResponse<StockIssueListItem>>(`${BASE}/issues/`, { params })
  return data
}

export async function fetchIssue(id: string) {
  const { data } = await apiClient.get<StockIssue>(`${BASE}/issues/${id}/`)
  return data
}

export async function createIssue(payload: object) {
  const { data } = await apiClient.post<StockIssue>(`${BASE}/issues/`, payload)
  return data
}

export async function approveIssue(id: string) {
  const { data } = await apiClient.post<StockIssue>(`${BASE}/issues/${id}/approve/`)
  return data
}

export async function executeIssue(id: string) {
  const { data } = await apiClient.post<StockIssue>(`${BASE}/issues/${id}/issue/`)
  return data
}

export async function returnIssueItem(itemId: string, payload: object) {
  const { data } = await apiClient.post(`${BASE}/issues/items/${itemId}/return/`, payload)
  return data
}

export async function consumeIssueItem(itemId: string, consumed_quantity: string) {
  const { data } = await apiClient.post(`${BASE}/issues/items/${itemId}/consume/`, { consumed_quantity })
  return data
}

export async function fetchMovements(params?: { search?: string; movement_type?: string }) {
  const { data } = await apiClient.get<PaginatedResponse<StockMovement>>(`${BASE}/stock/movements/`, { params })
  return data
}

export async function fetchAdjustments(params?: { search?: string }) {
  const { data } = await apiClient.get<PaginatedResponse<StockAdjustment>>(`${BASE}/stock/adjustments/`, { params })
  return data
}

export async function createAdjustment(payload: object) {
  const { data } = await apiClient.post<StockAdjustment>(`${BASE}/stock/adjustments/`, payload)
  return data
}

export async function fetchAlerts(type?: string) {
  const { data } = await apiClient.get<{ summary: AlertSummary; alerts: StockAlert[] }>(
    `${BASE}/alerts/`, { params: type ? { type } : {} },
  )
  return data
}

export async function fetchAlertSummary() {
  const { data } = await apiClient.get<AlertSummary>(`${BASE}/alerts/summary/`)
  return data
}

export async function fetchReportValuation() {
  const { data } = await apiClient.get<ValuationReport>(`${BASE}/reports/valuation/`)
  return data
}

export async function fetchReportReorder() {
  const { data } = await apiClient.get<ReorderReportRow[]>(`${BASE}/reports/reorder/`)
  return data
}

export async function fetchReportCurrentStock(search?: string) {
  const { data } = await apiClient.get<StockReportRow[]>(
    `${BASE}/reports/current-stock/`, { params: search ? { search } : {} },
  )
  return data
}

export async function fetchReportOutstandingReturns() {
  const { data } = await apiClient.get<StockIssueItem[]>(`${BASE}/reports/outstanding-returns/`)
  return data
}

export async function fetchReportItemsIssued(params?: { date_from?: string; date_to?: string }) {
  const { data } = await apiClient.get<StockIssueItem[]>(`${BASE}/reports/items-issued/`, { params })
  return data
}

export async function fetchReportExpiredItems() {
  const { data } = await apiClient.get<ExpiredItemRow[]>(`${BASE}/reports/expired-items/`)
  return data
}

export async function fetchReportSupplierPurchases(params?: { supplier?: string; date_from?: string; date_to?: string }) {
  const { data } = await apiClient.get<{
    summary: { supplier_id: string; supplier_name: string; purchase_count: number; total_amount: string }[]
    purchases: PurchaseListItem[]
  }>(`${BASE}/reports/supplier-purchases/`, { params })
  return data
}
