import { type SelectHTMLAttributes, forwardRef } from 'react'
import { cn } from '../../lib/cn'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, options, placeholder, ...props }, ref) => (
    <div>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={id}
        className={cn(
          'w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-all',
          'border-slate-200 bg-white text-slate-900',
          'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20',
          'dark:border-slate-700 dark:bg-slate-800 dark:text-white',
          error && 'border-red-400',
          className,
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  ),
)

Select.displayName = 'Select'
