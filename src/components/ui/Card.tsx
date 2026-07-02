import { type HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  padding?: 'sm' | 'md' | 'lg'
}

const paddingMap = {
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}

export function Card({
  className,
  hover = false,
  padding = 'md',
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white shadow-sm',
        'dark:border-slate-800 dark:bg-slate-900',
        hover && 'transition-shadow duration-200 hover:shadow-md dark:hover:shadow-slate-900/50',
        paddingMap[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
