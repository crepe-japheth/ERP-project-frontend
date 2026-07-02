import { AlertTriangle, Search } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { fetchStock } from '../../api/inventory'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { DataTable, TableCell, TableRow } from '../../components/ui/DataTable'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/ui/PageHeader'
import type { StockLevel } from '../../types/inventory'
import { cn } from '../../lib/cn'

export function StockPage() {
  const [stock, setStock] = useState<StockLevel[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchStock({
        search: search || undefined,
        low_stock: lowStockOnly,
      })
      setStock(data.results)
    } finally {
      setLoading(false)
    }
  }, [search, lowStockOnly])

  useEffect(() => {
    load()
  }, [load])

  return (
    <DashboardLayout title="Stock">
      <PageHeader
        title="Current Stock"
        description="View stock levels, availability, and low-stock alerts."
      >
        <Button
          variant={lowStockOnly ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setLowStockOnly((v) => !v)}
        >
          <AlertTriangle className="h-4 w-4" />
          Low Stock Only
        </Button>
      </PageHeader>

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <DataTable
        loading={loading}
        isEmpty={!loading && stock.length === 0}
        emptyMessage={lowStockOnly ? 'No low-stock items.' : 'No stock records yet. Add products to get started.'}
        columns={[
          { key: 'product', label: 'Product' },
          { key: 'warehouse', label: 'Warehouse' },
          { key: 'qty', label: 'Quantity' },
          { key: 'available', label: 'Available' },
          { key: 'reserved', label: 'Reserved' },
          { key: 'reorder', label: 'Reorder Level' },
          { key: 'status', label: 'Alert' },
        ]}
      >
        {stock.map((s) => (
          <TableRow
            key={s.id}
            className={cn(s.is_low_stock && 'bg-red-50/50 dark:bg-red-950/10')}
          >
            <TableCell>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{s.product_name}</p>
                <p className="text-xs text-slate-400">{s.product_code} · {s.category_name}</p>
              </div>
            </TableCell>
            <TableCell>{s.warehouse_name}</TableCell>
            <TableCell>
              <span className="font-medium">{s.quantity}</span>
              <span className="text-slate-400"> {s.unit_symbol}</span>
            </TableCell>
            <TableCell>{s.available_quantity}</TableCell>
            <TableCell>{s.reserved_quantity}</TableCell>
            <TableCell>{s.reorder_level}</TableCell>
            <TableCell>
              {s.is_low_stock ? (
                <Badge variant="danger">Low Stock</Badge>
              ) : (
                <Badge variant="success">OK</Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
      </DataTable>
    </DashboardLayout>
  )
}
