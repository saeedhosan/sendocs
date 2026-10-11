import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: ReactNode
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox({ label, id, className, ...props }, ref) {
    const generatedId = useId()
    const inputId = id ?? generatedId

    return (
      <div className={cn('inline-flex items-center gap-2', className)}>
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          className="size-4 shrink-0 rounded-sm border border-border-strong accent-primary cursor-pointer"
          {...props}
        />
        <label
          className="text-sm text-ink-secondary cursor-pointer select-none"
          htmlFor={inputId}
        >
          {label}
        </label>
      </div>
    )
  },
)
