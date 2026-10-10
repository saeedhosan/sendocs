import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ApiError,
  apiRequest,
  setSessionInvalidHandler,
} from '../../../../src/lib/api/client'
import { clearCsrfToken, setCsrfToken } from '../../../../src/lib/api/csrf'

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

const fetchMock = vi.fn()

beforeEach(() => {
  clearCsrfToken()
  setSessionInvalidHandler(null)
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('apiRequest', () => {
  it('parses a JSON body from the versioned endpoint', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }))

    await expect(apiRequest('/auth/session')).resolves.toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/auth/session',
      expect.objectContaining({ method: 'GET', credentials: 'same-origin' }),
    )
  })

  it('sends the CSRF token and JSON body on unsafe methods', async () => {
    setCsrfToken('token-123')
    fetchMock.mockResolvedValue(jsonResponse({}, { status: 201 }))

    await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: 'a@b.com' },
    })

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    const headers = init.headers as Headers

    expect(headers.get('X-CSRF-Token')).toBe('token-123')
    expect(headers.get('Content-Type')).toBe('application/json')
    expect(init.body).toBe(JSON.stringify({ email: 'a@b.com' }))
  })

  it('omits the CSRF header on GET requests', async () => {
    setCsrfToken('token-123')
    fetchMock.mockResolvedValue(jsonResponse({}))

    await apiRequest('/auth/session')

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect((init.headers as Headers).get('X-CSRF-Token')).toBeNull()
  })

  it('resolves undefined for a 204 response', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))

    await expect(apiRequest('/auth/logout', { method: 'POST' })).resolves.toBeUndefined()
  })

  it('throws an ApiError carrying the error envelope', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          error: {
            code: 'validation_failed',
            message: 'The given data was invalid.',
            details: { email: 'Already taken.' },
          },
        },
        { status: 422 },
      ),
    )

    await expect(apiRequest('/auth/register', { method: 'POST' })).rejects.toMatchObject({
      name: 'ApiError',
      code: 'validation_failed',
      status: 422,
      details: { email: 'Already taken.' },
    })
  })

  it('falls back to a generic error for a non-envelope body', async () => {
    fetchMock.mockResolvedValue(new Response('nope', { status: 500 }))

    await expect(apiRequest('/auth/session')).rejects.toMatchObject({
      code: 'internal_error',
      status: 500,
    })
  })

  it('captures Retry-After as whole seconds on a rate-limited response', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        { error: { code: 'rate_limited', message: 'Too many requests.' } },
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '30' } },
      ),
    )

    await expect(apiRequest('/auth/register', { method: 'POST' })).rejects.toMatchObject({
      code: 'rate_limited',
      status: 429,
      retryAfter: 30,
    })
  })

  it('notifies the shell when a 401 reports the session is gone', async () => {
    const onSessionInvalid = vi.fn()
    setSessionInvalidHandler(onSessionInvalid)
    fetchMock.mockResolvedValue(
      jsonResponse(
        { error: { code: 'unauthenticated', message: 'Unauthenticated.' } },
        { status: 401 },
      ),
    )

    await expect(apiRequest('/auth/session')).rejects.toMatchObject({
      code: 'unauthenticated',
    })
    expect(onSessionInvalid).toHaveBeenCalledOnce()
  })

  it('does not notify the shell for a 401 that reports bad credentials', async () => {
    const onInvalid = vi.fn()
    setSessionInvalidHandler(onInvalid)

    fetchMock.mockResolvedValue(
      jsonResponse(
        { error: { code: 'invalid_credentials', message: 'Wrong password.' } },
        { status: 401 },
      ),
    )

    await expect(
      apiRequest('/auth/login', { method: 'POST', body: {} }),
    ).rejects.toMatchObject({ code: 'invalid_credentials' })
    expect(onInvalid).not.toHaveBeenCalled()
  })

  it('maps a transport failure to network_error', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    const error = await apiRequest('/auth/session').catch((cause) => cause)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ code: 'network_error', status: 0 })
  })

  it('propagates an abort without wrapping it', async () => {
    fetchMock.mockRejectedValue(new DOMException('Aborted', 'AbortError'))

    await expect(apiRequest('/auth/session')).rejects.toBeInstanceOf(DOMException)
  })
})
