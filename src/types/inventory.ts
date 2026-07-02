export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface Category {
  id: string
  name: string
  code: string
  description: string
  parent: string | null
  parent_name: string | null
  product_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UnitOfMeasure {
  id: string
  name: string
  code: string
  symbol: string
  description: string
  is_active: boolean
}

export interface Supplier {
  id: string
  name: string
  code: string
  contact_person: string
  phone: string
  email: string
  address: string
  tax_number: string
  status: 'active' | 'inactive'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  code: string
  barcode: string
  name: string
  description: string
  category: string
  category_name: string
  unit: string
  unit_name: string
  unit_symbol: string
  item_type: 'consumable' | 'returnable' | 'mixed'
  item_type_display: string
  minimum_stock: string
  maximum_stock: string
  reorder_level: string
  status: 'active' | 'inactive'
  status_display: string
  current_quantity: string | number
  available_quantity: string | number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface StockLevel {
  id: string
  product: string
  product_code: string
  product_name: string
  category_name: string
  unit_symbol: string
  warehouse_name: string
  quantity: string
  reserved_quantity: string
  available_quantity: string
  average_cost: string
  last_purchase_cost: string
  minimum_stock: string
  maximum_stock: string
  reorder_level: string
  is_low_stock: boolean
  updated_at: string
}

export interface PurchaseItem {
  id: string
  product: string
  product_code: string
  product_name: string
  unit_symbol: string
  quantity: string
  unit_price: string
  discount: string
  tax: string
  total: string
  received_quantity: string
  rejected_quantity: string
  pending_quantity: string
}

export interface Purchase {
  id: string
  purchase_number: string
  supplier: string
  supplier_name: string
  invoice_number: string
  purchase_date: string
  expected_delivery: string | null
  status: string
  status_display: string
  total_amount: string
  remarks: string
  items: PurchaseItem[]
  created_at: string
}

export interface PurchaseListItem {
  id: string
  purchase_number: string
  supplier_name: string
  invoice_number: string
  purchase_date: string
  expected_delivery: string | null
  status: string
  status_display: string
  total_amount: string
  item_count: number
  created_at: string
}

export interface StockIssueItem {
  id: string
  product: string
  product_code: string
  product_name: string
  unit_symbol: string
  quantity: string
  issue_type: string
  issue_type_display: string
  expected_return_date: string | null
  quantity_returned: string
  quantity_consumed: string
  outstanding_quantity: string
  status: string
}

export interface StockIssue {
  id: string
  issue_number: string
  issue_date: string
  department: string
  employee_name: string
  project: string
  purpose: string
  status: string
  status_display: string
  items: StockIssueItem[]
  created_at: string
}

export interface StockIssueListItem {
  id: string
  issue_number: string
  issue_date: string
  department: string
  employee_name: string
  status: string
  status_display: string
  item_count: number
  created_at: string
}

export interface StockMovement {
  id: string
  product_code: string
  product_name: string
  warehouse_name: string
  movement_type: string
  movement_type_display: string
  quantity: string
  balance_after: string
  unit_cost: string
  reference_type: string
  reference_id: string
  notes: string
  created_by_name: string | null
  created_at: string
}

export interface StockAdjustment {
  id: string
  adjustment_number: string
  product_code: string
  product_name: string
  warehouse_name: string
  quantity_change: string
  reason: string
  reason_display: string
  remarks: string
  adjusted_by_name: string | null
  created_at: string
}

export interface StockAlert {
  type: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  message: string
  product_id?: string
  product_code?: string
  product_name?: string
  reference_id?: string
  warehouse_name?: string
  quantity?: string
  reorder_level?: string
  issue_number?: string
  employee_name?: string
  outstanding_quantity?: string
  expected_return_date?: string | null
  batch_number?: string
  expiry_date?: string
  days_until_expiry?: number
}

export interface AlertSummary {
  total: number
  counts: Record<string, number>
}

export interface StockReportRow {
  product_id: string
  product_code: string
  product_name: string
  category_name: string
  unit_symbol: string
  warehouse_name: string
  quantity: string
  reserved_quantity: string
  available_quantity: string
  average_cost: string
  stock_value: string
  reorder_level: string
  minimum_stock: string
}

export interface ValuationReport {
  total_value: string
  product_count: number
  by_category: { category: string; product_count: number; total_quantity: string; total_value: string }[]
  items: StockReportRow[]
}

export interface ReorderReportRow {
  product_id: string
  product_code: string
  product_name: string
  unit_symbol: string
  warehouse_name: string
  current_quantity: string
  reorder_level: string
  minimum_stock: string
  maximum_stock: string
  shortfall: string
  is_out_of_stock: boolean
}

export interface ExpiredItemRow {
  product_code: string
  product_name: string
  batch_number: string
  expiry_date: string
  received_quantity: string
  receipt_number: string
}
