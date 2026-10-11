import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

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
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-12 px-6 text-center',
        className,
      )}
    >
      {icon}
      <p className="text-base font-semibold text-ink">{title}</p>
      {message ? (
        <p className="max-w-sm text-sm leading-5 text-ink-muted">{message}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}
