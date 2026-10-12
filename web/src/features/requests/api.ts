import { apiRequest, ApiError, notifySessionInvalid } from '../../lib/api/client'
import type {
  CreatedRequest,
  CreateRequestInput,
  RequestDetail,
  RequestPage,
} from './types'

/** Default and maximum page size from the cursor-pagination contract. */
export const DEFAULT_LIMIT = 20
export const MAX_LIMIT = 100

/**
 * A stale CSRF token invalidates the in-memory session. The UI asks the owner
 * to sign in again, which obtains a fresh token without a session read.
 */
async function withCsrfRetry<T>(attempt: () => Promise<T>): Promise<T> {
  try {
    return await attempt()
  } catch (error) {
    if (error instanceof ApiError && error.code === 'csrf_failed') {
      notifySessionInvalid()
    }

    throw error
  }
}

export const requestsApi = {
  list(
    { limit = DEFAULT_LIMIT, cursor }: { limit?: number; cursor?: string | null },
    signal?: AbortSignal,
  ): Promise<RequestPage> {
    const params = new URLSearchParams({ limit: String(limit) })

    if (cursor) {
      params.set('cursor', cursor)
    }

    return apiRequest<RequestPage>(`/requests?${params.toString()}`, { signal })
  },

  get(id: string, signal?: AbortSignal): Promise<RequestDetail> {
    return apiRequest<RequestDetail>(`/requests/${encodeURIComponent(id)}`, {
      signal,
    })
  },

  create(input: CreateRequestInput): Promise<CreatedRequest> {
    return withCsrfRetry(() =>
      apiRequest<CreatedRequest>('/requests', { method: 'POST', body: input }),
    )
  },

  revoke(id: string): Promise<RequestDetail> {
    return withCsrfRetry(() =>
      apiRequest<RequestDetail>(
        `/requests/${encodeURIComponent(id)}/revoke`,
        { method: 'POST' },
      ),
    )
  },

  remove(id: string): Promise<void> {
    return withCsrfRetry(() =>
      apiRequest<void>(`/requests/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
    )
  },

  removeDocument(id: string, itemId: string): Promise<void> {
    return withCsrfRetry(() =>
      apiRequest<void>(
        `/requests/${encodeURIComponent(id)}/items/${encodeURIComponent(itemId)}/document`,
        { method: 'DELETE' },
      ),
    )
  },
}
