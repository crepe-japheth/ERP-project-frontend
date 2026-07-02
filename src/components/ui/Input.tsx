import { type InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '../../lib/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => (
    <div>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(
          'w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-all',
          'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400',
          'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20',
          'dark:border-slate-700 dark:bg-slate-800 dark:text-white',
          error && 'border-red-400 focus:border-red-400 focus:ring-red-400/20',
          className,
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  ),
)

Input.displayName = 'Input'
