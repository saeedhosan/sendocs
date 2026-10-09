import { Badge } from '../../../components/ui'
import { statusLabel, statusTone } from '../progress'
import type { RequestSummary } from '../types'

export type StatusBadgeProps = {
  request: Pick<RequestSummary, 'status'>
}

/** Upload-progress chip: Waiting or Complete, never colour alone. */
export function StatusBadge({ request }: StatusBadgeProps) {
  const tone = statusTone(request)

  return (
    <Badge variant={tone === 'complete' ? 'success' : 'warning'} dot>
      {statusLabel(request)}
    </Badge>
  )
}
