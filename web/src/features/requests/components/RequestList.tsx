import type { ReactNode } from 'react'
import { RequestRow } from './RequestRow'
import type { RequestSummary } from '../types'
import styles from './RequestList.module.css'

export type RequestListProps = {
  requests: RequestSummary[]
  footer?: ReactNode
}

export function RequestList({ requests, footer }: RequestListProps) {
  return (
    <div className={styles.list}>
      <div className={styles.header} aria-hidden="true">
        <span>Title</span>
        <span>Status</span>
        <span>Progress</span>
        <span>Last activity</span>
        <span className={styles.actionHeading}>Action</span>
      </div>
      {requests.map((request) => (
        <RequestRow key={request.id} request={request} />
      ))}
      {footer}
    </div>
  )
}
