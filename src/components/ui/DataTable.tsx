import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/cn'

interface DataTableProps {
  columns: { key: string; label: string; className?: string }[]
  children: React.ReactNode
  loading?: boolean
  emptyMessage?: string
  isEmpty?: boolean
}

export function DataTable({
  columns,
  children,
  loading,
  emptyMessage = 'No records found.',
  isEmpty,
}: DataTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-800/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400',
                    col.className,
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-600" />
                </td>
              </tr>
            ) : isEmpty ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function TableRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <tr className={cn('transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30', className)}>
      {children}
    </tr>
  )
}

export function TableCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={cn('px-4 py-3 text-slate-700 dark:text-slate-300', className)}>{children}</td>
  )
}
