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
    <div className="overflow-hidden border border-border rounded-md bg-surface shadow-sm">
      <div
        className="hidden md:grid md:grid-cols-[minmax(0,5fr)_2fr_3fr_2fr_4.5rem] md:gap-3 md:px-5 md:py-3 md:border-b md:border-border md:bg-canvas-muted md:text-[0.6875rem] md:font-medium md:tracking-[0.04em] md:uppercase md:text-ink-muted"
        aria-hidden="true"
      >
        <span>Title</span>
        <span>Status</span>
        <span>Progress</span>
        <span>Last activity</span>
        <span className="md:text-right">Action</span>
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
        <div className="px-5 py-3 border-t border-border bg-canvas-muted">
          {footer}
        </div>
      ) : null}
    </div>
  )
}
