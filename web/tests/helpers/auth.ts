import { vi } from 'vitest'

const sessionPayload = {
  user: {
    id: '1',
    name: 'Alex Morgan',
    email: 'alex@example.com',
    emailVerifiedAt: null,
  },
  csrfToken: 'csrf-123',
  expiresAt: '2099-01-01T00:00:00Z',
}

function envelope(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * Stubs `fetch` so an `AuthProvider` resolves the given session state once it
 * mounts. Returns the mock for per-test assertions.
 */
export function stubSession(authenticated: boolean) {
  const fetchMock = vi.fn((input: RequestInfo | URL) => {
    const url = String(input)

    if (url.endsWith('/auth/session')) {
      return Promise.resolve(
        authenticated
          ? envelope(200, sessionPayload)
          : envelope(401, {
              error: { code: 'unauthenticated', message: 'Not signed in.' },
            }),
      )
    }

    return Promise.resolve(
      envelope(404, { error: { code: 'not_found', message: 'Not found.' } }),
    )
  })

  vi.stubGlobal('fetch', fetchMock)

  return fetchMock
}
