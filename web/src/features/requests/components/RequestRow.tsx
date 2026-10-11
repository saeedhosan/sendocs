import { Link } from '../../../components/navigation/AppLink'
import { ProgressBar } from '../../../components/ui'
import { ChevronRightIcon } from '../../../components/icons'
import { formatDateTime, timeAgo } from '../../../lib/format'
import { percent, progressLabel } from '../progress'
import { StatusBadge } from './StatusBadge'
import type { RequestSummary } from '../types'
import styles from './RequestRow.module.css'

export type RequestRowProps = {
  request: RequestSummary
}

export function RequestRow({ request }: RequestRowProps) {
  const value = percent(request.uploaded, request.total)
  const href = `/requests/${request.id}`

  return (
    <div className={styles.row}>
      <div className={styles.titleCell}>
        <Link to={href} className={styles.title}>
          {request.title}
        </Link>
        <span className={styles.mobileStatus}>
          <StatusBadge request={request} />
        </span>
      </div>

      <div className={styles.statusCell}>
        <StatusBadge request={request} />
      </div>

      <div className={styles.progressCell}>
        <div className={styles.progressTop}>
          <span className={styles.progressLabel}>
            {progressLabel(request.uploaded, request.total)}
          </span>
          <span className={styles.percent}>{value}%</span>
        </div>
        <ProgressBar
          value={value}
          tone={request.status === 'complete' ? 'complete' : 'waiting'}
          label={progressLabel(request.uploaded, request.total)}
        />
      </div>

      <div className={styles.activityCell}>
        <span className={styles.mobileActivityLabel}>Activity:</span>
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

      <div className={styles.actionCell}>
        <Link to={href} className={styles.open}>
          <span>Open</span>
          <ChevronRightIcon size={16} />
        </Link>
      </div>
    </div>
  )
}
