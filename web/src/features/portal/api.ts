import { API_BASE, ApiError, apiRequest } from '../../lib/api/client'
import type { ErrorEnvelope } from '../../lib/api/client'
import type { PortalView } from './types'

export type UploadHandlers = {
  onProgress?: (percent: number) => void
  signal?: AbortSignal
}

function toApiError(status: number, payload: unknown): ApiError {
  const error = (payload as Partial<ErrorEnvelope> | null)?.error

  if (error && typeof error.code === 'string') {
    return new ApiError(
      error.code,
      error.message ?? 'Something went wrong.',
      status,
      error.details ?? {},
    )
  }

  return new ApiError('internal_error', 'Something went wrong. Try again.', status)
}

/*
 * The upload is deliberately an XMLHttpRequest rather than `fetch`: only XHR
 * exposes upload progress. It is a POST with no CSRF token, because the portal
 * is a cookie-less surface.
 */
function uploadFile(
  token: string,
  itemId: string,
  file: File,
  { onProgress, signal }: UploadHandlers = {},
): Promise<PortalView> {
  return new Promise<PortalView>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }

    const request = new XMLHttpRequest()
    const form = new FormData()
    form.append('file', file)

    const onAbort = () => request.abort()

    const settle = () => {
      signal?.removeEventListener('abort', onAbort)
    }

    request.open(
      'POST',
      `${API_BASE}/portal/${encodeURIComponent(token)}/items/${encodeURIComponent(itemId)}/file`,
    )
    request.responseType = 'json'
    request.setRequestHeader('Accept', 'application/json')

    request.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)))
      }
    })

    request.addEventListener('load', () => {
      settle()

      if (request.status >= 200 && request.status < 300) {
        resolve(request.response as PortalView)
        return
      }

      reject(toApiError(request.status, request.response))
    })

    request.addEventListener('error', () => {
      settle()
      reject(
        new ApiError(
          'network_error',
          'We could not reach the server. Check your connection and try again.',
          0,
        ),
      )
    })

    request.addEventListener('abort', () => {
      settle()
      reject(new DOMException('Aborted', 'AbortError'))
    })

    signal?.addEventListener('abort', onAbort, { once: true })

    request.send(form)
  })
}

export const portalApi = {
  /** Load the portal view for a token. The token is the whole credential. */
  view(token: string, signal?: AbortSignal): Promise<PortalView> {
    return apiRequest<PortalView>(`/portal/${encodeURIComponent(token)}`, {
      signal,
    })
  },

  /** Upload one file for one item; the server returns the updated view. */
  upload: uploadFile,
}
