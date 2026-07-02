import { useCallback, useEffect, useState } from 'react'
import {
  fetchReportCurrentStock,
  fetchReportExpiredItems,
  fetchReportItemsIssued,
  fetchReportOutstandingReturns,
  fetchReportReorder,
  fetchReportSupplierPurchases,
  fetchReportValuation,
} from '../../api/inventory'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { DataTable, TableCell, TableRow } from '../../components/ui/DataTable'
import { PageHeader } from '../../components/ui/PageHeader'
import type {
  ExpiredItemRow,
  ReorderReportRow,
  StockIssueItem,
  StockReportRow,
  ValuationReport,
} from '../../types/inventory'
import { cn } from '../../lib/cn'

type ReportTab =
  | 'valuation'
  | 'current_stock'
  | 'reorder'
  | 'items_issued'
  | 'outstanding_returns'
  | 'expired'
  | 'supplier_purchases'

const TABS: { id: ReportTab; label: string }[] = [
  { id: 'valuation', label: 'Inventory Valuation' },
  { id: 'current_stock', label: 'Current Stock' },
  { id: 'reorder', label: 'Reorder Report' },
  { id: 'items_issued', label: 'Items Issued' },
  { id: 'outstanding_returns', label: 'Outstanding Returns' },
  { id: 'expired', label: 'Expired Items' },
  { id: 'supplier_purchases', label: 'Supplier Purchases' },
]

export function ReportsPage() {
  const [tab, setTab] = useState<ReportTab>('valuation')
  const [loading, setLoading] = useState(true)
  const [valuation, setValuation] = useState<ValuationReport | null>(null)
  const [currentStock, setCurrentStock] = useState<StockReportRow[]>([])
  const [reorder, setReorder] = useState<ReorderReportRow[]>([])
  const [issued, setIssued] = useState<StockIssueItem[]>([])
  const [returns, setReturns] = useState<StockIssueItem[]>([])
  const [expired, setExpired] = useState<ExpiredItemRow[]>([])
  const [supplierData, setSupplierData] = useState<{
    summary: { supplier_name: string; purchase_count: number; total_amount: string }[]
  } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      switch (tab) {
        case 'valuation':
          setValuation(await fetchReportValuation())
          break
        case 'current_stock':
          setCurrentStock(await fetchReportCurrentStock())
          break
        case 'reorder':
          setReorder(await fetchReportReorder())
          break
        case 'items_issued':
          setIssued(await fetchReportItemsIssued())
          break
        case 'outstanding_returns':
          setReturns(await fetchReportOutstandingReturns())
          break
        case 'expired':
          setExpired(await fetchReportExpiredItems())
          break
        case 'supplier_purchases':
          setSupplierData(await fetchReportSupplierPurchases())
          break
      }
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => {
    load()
  }, [load])

  return (
    <DashboardLayout title="Reports">
      <PageHeader
        title="Inventory Reports"
        description="Stock valuation, reorder lists, issues, returns, and supplier purchase summaries."
      />

      <div className="mb-4 flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:text-sm',
              tab === t.id
                ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-800 dark:text-emerald-400'
                : 'text-slate-500 hover:text-slate-700',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading report...</div>
      ) : (
        <>
          {tab === 'valuation' && valuation && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card padding="md">
                  <p className="text-sm text-slate-500">Total Inventory Value</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-600">
                    RWF {Number(valuation.total_value).toLocaleString()}
                  </p>
                </Card>
                <Card padding="md">
                  <p className="text-sm text-slate-500">Products in Stock</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{valuation.product_count}</p>
                </Card>
                <Card padding="md">
                  <p className="text-sm text-slate-500">Categories</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{valuation.by_category.length}</p>
                </Card>
              </div>
              <Card padding="lg">
                <h3 className="mb-4 font-semibold">Value by Category</h3>
                <div className="space-y-2">
                  {valuation.by_category.map((cat) => (
                    <div key={cat.category} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">{cat.category}</span>
                      <span className="font-medium">RWF {Number(cat.total_value).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {tab === 'current_stock' && (
            <DataTable
              loading={false}
              isEmpty={currentStock.length === 0}
              columns={[
                { key: 'product', label: 'Product' },
                { key: 'qty', label: 'Qty' },
                { key: 'cost', label: 'Avg Cost' },
                { key: 'value', label: 'Stock Value' },
              ]}
            >
              {currentStock.map((row) => (
                <TableRow key={row.product_id}>
                  <TableCell>
                    <p className="font-medium">{row.product_name}</p>
                    <p className="text-xs text-slate-400">{row.product_code}</p>
                  </TableCell>
                  <TableCell>{row.quantity} {row.unit_symbol}</TableCell>
                  <TableCell>RWF {Number(row.average_cost).toLocaleString()}</TableCell>
                  <TableCell className="font-medium">RWF {Number(row.stock_value).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </DataTable>
          )}

          {tab === 'reorder' && (
            <DataTable
              loading={false}
              isEmpty={reorder.length === 0}
              emptyMessage="No products need reordering."
              columns={[
                { key: 'product', label: 'Product' },
                { key: 'current', label: 'Current' },
                { key: 'reorder', label: 'Reorder Level' },
                { key: 'shortfall', label: 'Shortfall' },
                { key: 'status', label: 'Status' },
              ]}
            >
              {reorder.map((row) => (
                <TableRow key={row.product_id}>
                  <TableCell>{row.product_name}</TableCell>
                  <TableCell>{row.current_quantity}</TableCell>
                  <TableCell>{row.reorder_level}</TableCell>
                  <TableCell className="font-medium text-red-600">{row.shortfall}</TableCell>
                  <TableCell>
                    {row.is_out_of_stock ? <Badge variant="danger">Out of Stock</Badge> : <Badge variant="warning">Low</Badge>}
                  </TableCell>
                </TableRow>
              ))}
            </DataTable>
          )}

          {tab === 'items_issued' && (
            <DataTable
              loading={false}
              isEmpty={issued.length === 0}
              columns={[
                { key: 'product', label: 'Product' },
                { key: 'qty', label: 'Qty' },
                { key: 'type', label: 'Type' },
                { key: 'status', label: 'Status' },
              ]}
            >
              {issued.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.product_name}</TableCell>
                  <TableCell>{row.quantity}</TableCell>
                  <TableCell><Badge variant="info">{row.issue_type_display}</Badge></TableCell>
                  <TableCell>{row.status}</TableCell>
                </TableRow>
              ))}
            </DataTable>
          )}

          {tab === 'outstanding_returns' && (
            <DataTable
              loading={false}
              isEmpty={returns.length === 0}
              emptyMessage="No outstanding returns."
              columns={[
                { key: 'product', label: 'Product' },
                { key: 'outstanding', label: 'Outstanding' },
                { key: 'return_by', label: 'Expected Return' },
                { key: 'status', label: 'Status' },
              ]}
            >
              {returns.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.product_name}</TableCell>
                  <TableCell className="font-medium">{row.outstanding_quantity}</TableCell>
                  <TableCell>{row.expected_return_date ?? '—'}</TableCell>
                  <TableCell><Badge variant="warning">{row.status}</Badge></TableCell>
                </TableRow>
              ))}
            </DataTable>
          )}

          {tab === 'expired' && (
            <DataTable
              loading={false}
              isEmpty={expired.length === 0}
              emptyMessage="No expired items."
              columns={[
                { key: 'product', label: 'Product' },
                { key: 'batch', label: 'Batch' },
                { key: 'expiry', label: 'Expiry Date' },
                { key: 'qty', label: 'Qty' },
              ]}
            >
              {expired.map((row, i) => (
                <TableRow key={i}>
                  <TableCell>{row.product_name}</TableCell>
                  <TableCell>{row.batch_number || '—'}</TableCell>
                  <TableCell className="text-red-600">{row.expiry_date}</TableCell>
                  <TableCell>{row.received_quantity}</TableCell>
                </TableRow>
              ))}
            </DataTable>
          )}

          {tab === 'supplier_purchases' && supplierData && (
            <Card padding="lg">
              <h3 className="mb-4 font-semibold">Purchases by Supplier</h3>
              {supplierData.summary.length === 0 ? (
                <p className="text-sm text-slate-500">No purchase data yet.</p>
              ) : (
                <div className="space-y-3">
                  {supplierData.summary.map((row) => (
                    <div key={row.supplier_name} className="flex items-center justify-between border-b border-slate-100 py-2 text-sm dark:border-slate-800">
                      <div>
                        <p className="font-medium">{row.supplier_name}</p>
                        <p className="text-xs text-slate-400">{row.purchase_count} purchases</p>
                      </div>
                      <span className="font-medium">RWF {Number(row.total_amount).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </>
      )}
    </DashboardLayout>
  )
}
