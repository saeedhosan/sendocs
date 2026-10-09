import { getCsrfToken } from './csrf'

export const API_BASE = '/api/v1'

export type ApiErrorCode = string

export type ErrorEnvelope = {
  error: {
    code: ApiErrorCode
    message: string
    details?: Record<string, string>
  }
}

/**
 * A failed API call, carrying the published error envelope fields.
 *
 * `details` is a flat field-to-message map and is only present on
 * validation_failed responses.
 */
export class ApiError extends Error {
  readonly code: ApiErrorCode
  readonly status: number
  readonly details: Record<string, string>

  constructor(
    code: ApiErrorCode,
    message: string,
    status: number,
    details: Record<string, string> = {},
  ) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.details = details
  }
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type RequestOptions = {
  method?: HttpMethod
  body?: unknown
  signal?: AbortSignal
}

function isSafeMethod(method: HttpMethod): boolean {
  return method === 'GET'
}

async function parseError(response: Response): Promise<ApiError> {
  try {
    const payload = (await response.json()) as Partial<ErrorEnvelope>
    const error = payload.error

    if (error && typeof error.code === 'string') {
      return new ApiError(
        error.code,
        error.message ?? 'Something went wrong.',
        response.status,
        error.details ?? {},
      )
    }
  } catch {
    // Fall through to a generic error when the body is not the envelope.
  }

  return new ApiError(
    'internal_error',
    'Something went wrong. Try again.',
    response.status,
  )
}

/**
 * Call the versioned API on the same origin.
 *
 * Throws an {@link ApiError} for every non-2xx response, and a synthetic
 * `network_error` when the request never reaches the API.
 */
export async function apiRequest<T>(
  path: string,
  { method = 'GET', body, signal }: RequestOptions = {},
): Promise<T> {
  const headers = new Headers({ Accept: 'application/json' })

  if (body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  if (!isSafeMethod(method)) {
    const token = getCsrfToken()

    if (token !== null) {
      headers.set('X-CSRF-Token', token)
    }
  }

  let response: Response

  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'same-origin',
      signal,
    })
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') {
      throw cause
    }

    throw new ApiError(
      'network_error',
      'We could not reach the server. Check your connection and try again.',
      0,
    )
  }

  if (!response.ok) {
    throw await parseError(response)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
