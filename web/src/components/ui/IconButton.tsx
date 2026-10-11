import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

const ICON_BUTTON =
  'inline-flex items-center justify-center size-7 p-1 border-0 rounded-sm bg-transparent text-ink-placeholder cursor-pointer transition-colors duration-150 enabled:hover:text-ink-secondary disabled:opacity-[0.65] disabled:cursor-not-allowed'

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  children: ReactNode
}

/**
 * A square, icon-only button. `label` is required and becomes the accessible
 * name, since the icon itself is decorative.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton({ label, className, type = 'button', children, ...props }, ref) {
    return (
      <button
        ref={ref}
        type={type}
        aria-label={label}
        className={cn(ICON_BUTTON, className)}
        {...props}
      >
        {children}
      </button>
    )
  },
)
