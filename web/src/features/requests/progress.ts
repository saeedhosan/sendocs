import type { RequestDetail, RequestSummary } from './types'

export type LinkState = 'active' | 'revoked' | 'expired'
export type RequestTone = 'waiting' | 'complete' | 'revoked' | 'expired'

/** The fraction the owner reads first: `3 of 5 uploaded`. */
export function progressLabel(uploaded: number, total: number): string {
  return `${uploaded} of ${total} uploaded`
}

/** Integer percentage for the bar readout. `total` is never zero. */
export function percent(uploaded: number, total: number): number {
  return Math.round((uploaded / Math.max(total, 1)) * 100)
}

export function isExpired(expiresAt: string, now: number = Date.now()): boolean {
  return new Date(expiresAt).getTime() <= now
}

/** Link state is independent of upload progress. */
export function linkState(
  request: Pick<RequestSummary, 'revokedAt' | 'expiresAt'>,
  now: number = Date.now(),
): LinkState {
  if (request.revokedAt) {
    return 'revoked'
  }

  if (isExpired(request.expiresAt, now)) {
    return 'expired'
  }

  return 'active'
}

export function linkStateLabel(state: LinkState): string {
  switch (state) {
    case 'revoked':
      return 'Revoked'
    case 'expired':
      return 'Expired'
    default:
      return 'Active'
  }
}

/**
 * Upload-progress label for the status chip.
 *
 * Link state is deliberately excluded; expiry and revocation belong to the link
 * panel so a live link at zero reads "Waiting", not "Expired".
 */
export function statusLabel(
  request: Pick<RequestSummary, 'status'>,
): string {
  return request.status === 'complete' ? 'Complete' : 'Waiting'
}

export function statusTone(
  request: Pick<RequestSummary, 'status'>,
): RequestTone {
  return request.status === 'complete' ? 'complete' : 'waiting'
}

export function itemStateLabel(item: Pick<RequestDetail['items'][number], 'state'>): string {
  return item.state === 'uploaded' ? 'Uploaded' : 'Waiting'
}
