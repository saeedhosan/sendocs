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
    <div className="flex flex-col gap-3 p-4 border-b border-border-subtle transition-colors duration-150 last:border-b-0 hover:bg-[#fbfbfb] md:grid md:grid-cols-12 md:items-center md:gap-3 md:px-5 md:py-3.5">
      <div className="flex items-start justify-between gap-2 md:col-span-5 md:block">
        <Link
          to={href}
          className="text-[0.8125rem] font-medium text-ink break-words transition-colors duration-150 hover:text-primary"
        >
          {request.title}
        </Link>
        <span className="md:hidden">
          <StatusBadge request={request} />
        </span>
      </div>

      <div className="hidden md:col-span-2 md:block">
        <StatusBadge request={request} />
      </div>

      <div className="flex flex-col gap-1.5 md:col-span-2">
        <div className="flex items-center justify-between font-mono text-xs text-ink-secondary">
          <span>{progressLabel(request.uploaded, request.total)}</span>
          <span className="text-ink-muted md:hidden">{value}%</span>
        </div>
        <ProgressBar
          value={value}
          tone={request.status === 'complete' ? 'complete' : 'waiting'}
          label={progressLabel(request.uploaded, request.total)}
          className="border border-border-subtle/50 bg-surface-muted"
        />
      </div>

      <div className="flex items-center font-mono text-xs text-ink-muted whitespace-nowrap md:col-span-2 md:justify-start">
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

      <div className="flex justify-end pt-2 border-t border-border-subtle mt-1 md:col-span-1 md:pt-0 md:border-t-0">
        <Link
          to={href}
          className="inline-flex items-center gap-0.5 min-h-11 px-2 py-1.5 rounded-[6px] text-xs font-medium text-primary transition-colors duration-150 hover:text-primary-hover md:min-h-0 md:border md:border-border-subtle md:px-2.5"
        >
          <span>Open</span>
          <ChevronRightIcon size={14} />
        </Link>
      </div>
    </div>
  )
}
