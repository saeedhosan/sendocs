import type { ReactNode } from 'react'
import { RequestRow } from './RequestRow'
import type { RequestSummary } from '../types'
import styles from './RequestList.module.css'

export type RequestListProps = {
  requests: RequestSummary[]
  footer?: ReactNode
  empty?: ReactNode
}

export function RequestList({ requests, footer, empty }: RequestListProps) {
  return (
    <div className={styles.list}>
      <div className={styles.header} aria-hidden="true">
        <span>Title</span>
        <span>Status</span>
        <span>Progress</span>
        <span>Last activity</span>
        <span className={styles.actionHeading}>Action</span>
      </div>
      {requests.length > 0 ? (
        requests.map((request) => (
          <RequestRow key={request.id} request={request} />
        ))
      ) : (
        <div className={styles.empty}>{empty}</div>
      )}
      {footer ? <div className={styles.footer}>{footer}</div> : null}
    </div>
  )
}
