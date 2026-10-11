import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type BadgeVariant =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'

const BADGE =
  'inline-flex items-center gap-1.5 px-2 py-0.5 border border-transparent rounded-sm text-[0.6875rem] font-medium leading-4 whitespace-nowrap'

const VARIANTS: Record<BadgeVariant, string> = {
  neutral: 'bg-surface-sunken border-border text-ink-secondary',
  success: 'bg-success-surface border-success-border text-success-text',
  warning: 'bg-warning-surface border-warning-border text-warning-text',
  danger: 'bg-danger-surface border-danger-border text-danger-text',
  info: 'bg-info-surface border-info-border text-info-text',
}

export type BadgeProps = {
  variant?: BadgeVariant
  /** Optional leading dot, e.g. an upload status indicator. */
  dot?: boolean
  className?: string
  children: ReactNode
}

export function Badge({
  variant = 'neutral',
  dot = false,
  className,
  children,
}: BadgeProps) {
  return (
    <span className={cn(BADGE, VARIANTS[variant], className)}>
      {dot ? (
        <span
          className="size-1.5 rounded-full bg-current"
          aria-hidden="true"
        />
      ) : null}
      {children}
    </span>
  )
}
