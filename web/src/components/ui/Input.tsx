import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean
}

const BASE =
  'h-10 w-full rounded-md border bg-surface px-3 py-2 text-sm leading-5 text-ink outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-ink-placeholder disabled:bg-surface-sunken disabled:cursor-not-allowed'

const INVALID =
  'border-danger focus:border-danger focus:shadow-[0_0_0_1px_var(--color-danger)]'

const VALID =
  'border-border-strong focus:border-focus focus:shadow-[0_0_0_1px_var(--color-focus)]'

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid = false, className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(BASE, invalid ? INVALID : VALID, className)}
      {...props}
    />
  )
})
