import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { AlertIcon, CheckCircleIcon, InfoIcon } from '../icons'

export type AlertVariant = 'error' | 'success' | 'info' | 'warning'

const ALERT =
  'flex items-start gap-2 p-3 border rounded-md text-[0.8125rem] leading-5'

const VARIANTS: Record<AlertVariant, string> = {
  error: 'bg-danger-surface border-danger-border text-danger-text',
  success: 'bg-success-surface border-success-border text-success-text',
  info: 'bg-info-surface border-info-border text-info-text',
  warning: 'bg-warning-surface border-warning-border text-warning-text',
}

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
      className={cn(ALERT, VARIANTS[variant], className)}
    >
      <span className="shrink-0 mt-px" aria-hidden="true">
        {icons[variant]}
      </span>
      <div className="flex-1">
        {title ? <p className="font-medium">{title}</p> : null}
        {children}
      </div>
    </div>
  )
}
