import { type ReactNode } from 'react'
import { Button } from './Button'

interface PageHeaderProps {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  children?: ReactNode
}

export function PageHeader({ title, description, actionLabel, onAction, children }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {children}
        {actionLabel && onAction && (
          <Button onClick={onAction}>{actionLabel}</Button>
        )}
      </div>
    </div>
  )
}
