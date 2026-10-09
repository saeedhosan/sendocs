import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import styles from './Badge.module.css'

export type BadgeVariant =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'

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
    <span className={cn(styles.badge, styles[variant], className)}>
      {dot ? <span className={styles.dot} aria-hidden="true" /> : null}
      {children}
    </span>
  )
}
