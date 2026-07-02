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
