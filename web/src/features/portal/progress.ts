/**
 * The four progress numbers are read straight from the payload; the portal
 * never recomputes them from item state. These helpers only format them.
 */
export function progressLabel(uploaded: number, total: number): string {
  return `${uploaded} of ${total} uploaded`
}

export function remainingLabel(remaining: number): string {
  if (remaining <= 0) {
    return 'Nothing left to upload'
  }

  return `${remaining} item${remaining === 1 ? '' : 's'} remaining`
}

export function uploadPercent(uploaded: number, total: number): number {
  return Math.round((uploaded / Math.max(total, 1)) * 100)
}
