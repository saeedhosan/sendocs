import { Badge } from "@/components/ui/badge"
import { statusLabel, statusTone } from '../progress'
import type { RequestSummary } from '../types'

export type StatusBadgeProps = {
  request: Pick<RequestSummary, 'status'>
}

/** Upload-progress chip: Waiting or Complete, never colour alone. */
export function StatusBadge({ request }: StatusBadgeProps) {
  const tone = statusTone(request)

  if (tone === 'complete') {
    return (
      <Badge variant="outline" className="border-success/20 bg-success/10 text-success">
        {statusLabel(request)}
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="border-warning-border bg-warning-surface text-warning-text">
      {statusLabel(request)}
    </Badge>
  )
}
