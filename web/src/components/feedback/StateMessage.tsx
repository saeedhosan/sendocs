import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import styles from './StateMessage.module.css'

export type StateMessageProps = {
  title: ReactNode
  message?: ReactNode
  action?: ReactNode
  icon?: ReactNode
  className?: string
}

/** Shared shell for full-block loading, empty, and error states. */
export function StateMessage({
  title,
  message,
  action,
  icon,
  className,
}: StateMessageProps) {
  return (
    <div className={cn(styles.state, className)}>
      {icon}
      <p className={styles.title}>{title}</p>
      {message ? <p className={styles.message}>{message}</p> : null}
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  )
}
