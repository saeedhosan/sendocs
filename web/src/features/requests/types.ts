export type ProgressStatus = 'waiting' | 'complete'
export type ItemState = 'waiting' | 'uploaded'

export type RequestSummary = {
  id: string
  title: string
  status: ProgressStatus
  uploaded: number
  total: number
  lastActivityAt: string | null
  createdAt: string
  expiresAt: string
  revokedAt: string | null
}

export type RequestDocument = {
  id: string
  originalName: string
  mimeType: string
  sizeBytes: number
  uploadedAt: string
  downloadUrl: string | null
}

export type RequestItem = {
  id: string
  label: string
  position: number
  state: 'waiting' | 'uploaded'
  document: RequestDocument | null
}

export type RequestDetail = RequestSummary & {
  items: RequestItem[]
}

export type RequestPage = {
  data: RequestSummary[]
  nextCursor: string | null
}

export type MagicLink = {
  url: string
  expiresAt: string
}

export type CreatedRequest = {
  request: RequestDetail
  link: MagicLink
}

export type CreateRequestItemInput = {
  label: string
}

export type CreateRequestInput = {
  title: string
  items: CreateRequestItemInput[]
}
