import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { ArrowBackIcon } from '../icons'

const WRAP =
  'flex flex-col gap-3 pb-6  sm:flex-row sm:items-start sm:justify-between'
const TITLE =
  'text-xl leading-7 font-semibold tracking-tight text-ink sm:text-2xl sm:leading-8'
const SUBTITLE = 'mt-1 text-sm text-ink-secondary'
const ACTIONS =
  'flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-shrink-0 [&>*]:w-full [&>*]:min-h-8 sm:[&>*]:min-h-8 sm:[&>*]:w-auto'

export type PageHeaderProps = {
  title: ReactNode
  subtitle?: ReactNode
  /** Rendered inline with the title, e.g. a status badge. */
  badge?: ReactNode
  actions?: ReactNode
  back?: { to: string; label: string }
  className?: string
}

/**
 * The one page header for signed-in pages: a consistent title/subtitle block
 * with an optional back link, right-aligned actions, and a divider, so the
 * dashboard, create request, and request detail pages line up identically.
 */
export function PageHeader({
  title,
  subtitle,
  badge,
  actions,
  back,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {back ? (
        <Link
          to={back.to}
          className="inline-flex items-center gap-1 self-start text-xs text-ink-muted transition-colors duration-150 hover:text-ink"
        >
          <ArrowBackIcon size={14} />
          <span>{back.label}</span>
        </Link>
      ) : null}

      <div className={WRAP}>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className={TITLE}>{title}</h1>
            {badge}
          </div>
          {subtitle ? <p className={SUBTITLE}>{subtitle}</p> : null}
        </div>

        {actions ? <div className={ACTIONS}>{actions}</div> : null}
      </div>
    </div>
  )
}
