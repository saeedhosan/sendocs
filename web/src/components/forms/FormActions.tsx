import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import styles from './FormActions.module.css'

export type FormActionsProps = {
  /** Lay buttons side by side from the medium width up. */
  row?: boolean
  className?: string
  children: ReactNode
}

export function FormActions({ row = false, className, children }: FormActionsProps) {
  return (
    <div className={cn(styles.actions, row && styles.row, className)}>
      {children}
    </div>
  )
}
