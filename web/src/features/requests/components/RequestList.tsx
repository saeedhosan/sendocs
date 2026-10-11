import type { ReactNode } from 'react'
import { RequestRow } from './RequestRow'
import type { RequestSummary } from '../types'

export type RequestListProps = {
  requests: RequestSummary[]
  footer?: ReactNode
  empty?: ReactNode
}

export function RequestList({ requests, footer, empty }: RequestListProps) {
  return (
    <div className="overflow-hidden border border-border-subtle rounded-[10px] bg-surface shadow-xs">
      <div
        className="hidden md:grid md:grid-cols-12 md:gap-3 md:px-5 md:py-3 md:border-b md:border-border-subtle md:bg-surface-subtle md:text-[0.6875rem] md:font-medium md:tracking-wider md:uppercase md:text-ink-muted"
        aria-hidden="true"
      >
        <span className="md:col-span-5">Title</span>
        <span className="md:col-span-2">Status</span>
        <span className="md:col-span-2">Progress</span>
        <span className="md:col-span-2">Last activity</span>
        <span className="md:col-span-1 md:text-right">Action</span>
      </div>
      {requests.length > 0 ? (
        requests.map((request) => (
          <RequestRow key={request.id} request={request} />
        ))
      ) : (
        <div className="px-5 py-10 text-center text-[0.8125rem] text-ink-muted">
          {empty}
        </div>
      )}
      {footer ? (
        <div className="px-5 py-3 border-t border-border-subtle bg-surface-subtle">
          {footer}
        </div>
      ) : null}
    </div>
  )
}
