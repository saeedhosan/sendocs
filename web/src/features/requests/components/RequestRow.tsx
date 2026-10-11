import { Link } from 'react-router-dom'
import { ProgressBar } from '../../../components/ui'
import { ChevronRightIcon } from '../../../components/icons'
import { formatDateTime, timeAgo } from '../../../lib/format'
import { percent, progressLabel } from '../progress'
import { StatusBadge } from './StatusBadge'
import type { RequestSummary } from '../types'

export type RequestRowProps = {
  request: RequestSummary
}

export function RequestRow({ request }: RequestRowProps) {
  const value = percent(request.uploaded, request.total)
  const href = `/requests/${request.id}`

  return (
    <div className="flex flex-col gap-3 p-4 border-b border-border-subtle transition-colors duration-150 last:border-b-0 hover:bg-canvas-muted md:grid md:grid-cols-[minmax(0,5fr)_2fr_3fr_2fr_4.5rem] md:items-center md:gap-3 md:px-5 md:py-3.5">
      <div className="flex items-start justify-between gap-2 md:block">
        <Link
          to={href}
          className="text-sm font-medium leading-[1.35] text-ink break-words hover:text-primary md:text-[0.8125rem]"
        >
          {request.title}
        </Link>
        <span className="md:hidden">
          <StatusBadge request={request} />
        </span>
      </div>

      <div className="hidden md:block">
        <StatusBadge request={request} />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between font-mono text-xs text-ink-secondary">
          <span>{progressLabel(request.uploaded, request.total)}</span>
          <span className="text-ink-muted md:hidden">{value}%</span>
        </div>
        <ProgressBar
          value={value}
          tone={request.status === 'complete' ? 'complete' : 'waiting'}
          label={progressLabel(request.uploaded, request.total)}
        />
      </div>

      <div className="flex items-center font-mono text-xs text-ink-muted whitespace-nowrap md:justify-start">
        <span className="mr-1 font-sans text-[0.6875rem] text-ink-secondary md:hidden">
          Activity:
        </span>
        {request.lastActivityAt ? (
          <time
            dateTime={request.lastActivityAt}
            title={formatDateTime(request.lastActivityAt)}
          >
            {timeAgo(request.lastActivityAt)}
          </time>
        ) : (
          <span>{timeAgo(null)}</span>
        )}
      </div>

      <div className="flex justify-end pt-2 border-t border-border-subtle mt-1 md:pt-0 md:border-t-0">
        <Link
          to={href}
          className="inline-flex items-center gap-0.5 min-h-11 px-2 py-1.5 rounded-sm text-xs font-medium text-primary hover:bg-surface-muted"
        >
          <span>Open</span>
          <ChevronRightIcon size={16} />
        </Link>
      </div>
    </div>
  )
}
