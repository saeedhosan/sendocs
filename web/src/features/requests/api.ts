import { authApi } from '../auth/api'
import { apiRequest, ApiError, notifySessionInvalid } from '../../lib/api/client'
import { setCsrfToken } from '../../lib/api/csrf'
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
 * Retry a state-changing call once after refreshing a stale CSRF token.
 *
 * A `403 csrf_failed` means the session is still valid but the in-memory token
 * is out of date, so the session endpoint is re-fetched and the call retried
 * once. A second failure signs out, per owner-dashboard.md.
 */
async function withCsrfRetry<T>(attempt: () => Promise<T>): Promise<T> {
  try {
    return await attempt()
  } catch (error) {
    if (error instanceof ApiError && error.code === 'csrf_failed') {
      const session = await authApi.session()
      setCsrfToken(session.csrfToken)

      try {
        return await attempt()
      } catch (retryError) {
        if (retryError instanceof ApiError && retryError.code === 'csrf_failed') {
          notifySessionInvalid()
        }

        throw retryError
      }
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
