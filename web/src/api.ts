export type ApiError = Error & {
  status: number
  code: string
  details?: Record<string, unknown>
  retryAfter?: number
}

export type User = { id: string; name: string; email: string; emailVerifiedAt: string | null }
export type Session = { user: User; csrfToken: string; expiresAt: string }
export type RequestSummary = {
  id: string; title: string; status: 'waiting' | 'complete'; uploaded: number; total: number
  lastActivityAt: string | null; createdAt: string; expiresAt: string; revokedAt: string | null
}
export type RequestItem = {
  id: string; label: string; position: number; state: 'waiting' | 'uploaded'
  document: null | { id: string; originalName: string; mimeType: string; sizeBytes: number; uploadedAt: string; downloadUrl: string }
}
export type RequestDetail = RequestSummary & { items: RequestItem[] }
export type RequestPage = { data: RequestSummary[]; nextCursor: string | null }
export type CreatedRequest = { request: RequestDetail; link: { url: string; expiresAt: string } }

let csrfToken: string | null = null

function makeError(status: number, payload: unknown, retryAfter: string | null): ApiError {
  const envelope = payload && typeof payload === 'object'
    ? (payload as { error?: { code?: string; message?: string; details?: Record<string, unknown> } }).error
    : undefined
  const error = new Error(envelope?.message ?? 'Something went wrong. Please try again.') as ApiError
  error.status = status
  error.code = envelope?.code ?? 'unexpected_error'
  error.details = envelope?.details
  error.retryAfter = retryAfter ? Number(retryAfter) : undefined
  return error
}

async function rawRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  if (csrfToken && init.method && !['GET', 'HEAD', 'OPTIONS'].includes(init.method.toUpperCase())) {
    headers.set('X-CSRF-Token', csrfToken)
  }
  const response = await fetch(path, { ...init, headers, credentials: 'include' })
  if (response.status === 204) return undefined as T
  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) throw makeError(response.status, payload, response.headers.get('Retry-After'))
  return payload as T
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  try {
    return await rawRequest<T>(path, init)
  } catch (error) {
    const apiError = error as ApiError
    if (apiError.status !== 403 || apiError.code !== 'csrf_failed' || !csrfToken) throw error
    const previousToken = csrfToken
    try {
      csrfToken = (await rawRequest<Session>('/api/v1/auth/session')).csrfToken
    } catch {
      csrfToken = null
      throw error
    }
    if (csrfToken === previousToken) {
      csrfToken = null
      throw error
    }
    return rawRequest<T>(path, init)
  }
}

export async function getSession(): Promise<Session> {
  const session = await rawRequest<Session>('/api/v1/auth/session')
  csrfToken = session.csrfToken
  return session
}
export async function login(email: string, password: string): Promise<Session> {
  const session = await rawRequest<Session>('/api/v1/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
  csrfToken = session.csrfToken
  return session
}
export async function register(name: string, email: string, password: string): Promise<Session> {
  const session = await rawRequest<Session>('/api/v1/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) })
  csrfToken = session.csrfToken
  return session
}
export async function logout(): Promise<void> {
  await api<void>('/api/v1/auth/logout', { method: 'POST' })
  csrfToken = null
}
export function clearSession(): void { csrfToken = null }
