import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { AlertIcon, CheckCircleIcon, InfoIcon } from '../icons'
import styles from './Alert.module.css'

export type AlertVariant = 'error' | 'success' | 'info' | 'warning'

export type AlertProps = {
  variant?: AlertVariant
  title?: ReactNode
  children?: ReactNode
  className?: string
}

const icons: Record<AlertVariant, ReactNode> = {
  error: <AlertIcon size={18} />,
  success: <CheckCircleIcon size={18} />,
  info: <InfoIcon size={18} />,
  warning: <AlertIcon size={18} />,
}

export function Alert({
  variant = 'info',
  title,
  children,
  className,
}: AlertProps) {
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn(styles.alert, styles[variant], className)}
    >
      <span className={styles.icon} aria-hidden="true">
        {icons[variant]}
      </span>
      <div className={styles.body}>
        {title ? <p className={styles.title}>{title}</p> : null}
        {children}
      </div>
    </div>
  )
}
