/** The two item states the portal view itself can carry. */
export type PortalItemState = 'waiting' | 'uploaded'

export type PortalItemFile = {
  originalName: string
  sizeBytes: number
  uploadedAt: string
}

export type PortalItem = {
  id: string
  label: string
  position: number
  state: PortalItemState
  file: PortalItemFile | null
}

/**
 * The `PortalView` payload from `GET /api/v1/portal/{token}`.
 *
 * It deliberately carries no download URL, storage key, or MIME type: the
 * client sees only a title, its items, and four progress numbers.
 */
export type PortalView = {
  title: string
  status: 'waiting' | 'complete'
  uploaded: number
  total: number
  lastActivityAt: string | null
  expiresAt: string
  items: PortalItem[]
}
