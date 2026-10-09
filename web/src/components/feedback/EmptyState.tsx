import type { ReactNode } from 'react'
import { StateMessage } from './StateMessage'

export type EmptyStateProps = {
  icon?: ReactNode
  title: ReactNode
  message?: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({
  icon,
  title,
  message,
  action,
  className,
}: EmptyStateProps) {
  return (
    <StateMessage
      title={title}
      message={message}
      action={action}
      icon={icon}
      className={className}
    />
  )
}
