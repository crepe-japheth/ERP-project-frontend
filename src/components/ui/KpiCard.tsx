import type { LucideIcon } from 'lucide-react'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Card } from './Card'

interface KpiCardProps {
  title: string
  value: string | number
  change: string
  trend: 'up' | 'down' | 'neutral'
  icon: LucideIcon
  iconBg: string
  iconColor: string
}

export function KpiCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  iconBg,
  iconColor,
}: KpiCardProps) {
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus

  return (
    <Card hover padding="md" className="group">
      <div className="flex items-start justify-between">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105"
          style={{ backgroundColor: iconBg }}
        >
          <Icon className="h-5 w-5" style={{ color: iconColor }} />
        </div>
        <span
          className={cn(
            'flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium',
            trend === 'up' && 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
            trend === 'down' && 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400',
            trend === 'neutral' && 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
          )}
        >
          <TrendIcon className="h-3 w-3" />
          {change}
        </span>
      </div>
      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{title}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        {value}
      </p>
    </Card>
  )
}
