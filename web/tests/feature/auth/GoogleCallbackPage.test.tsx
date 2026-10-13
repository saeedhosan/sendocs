import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../../../src/app/providers/AuthProvider'
import { ThemeProvider } from '../../../src/app/providers/ThemeProvider'
import { GoogleCallbackPage } from '../../../src/features/auth/pages/GoogleCallbackPage'

const fetchMock = vi.fn()

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

function errorEnvelope(status: number, code: string, message: string): Response {
  return new Response(JSON.stringify({ error: { code, message } }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function renderCallback(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
            <Route path="/login" element={<h1>Sign in</h1>} />
            <Route path="/dashboard" element={<h1>Dashboard</h1>} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  fetchMock.mockReset()
  fetchMock.mockImplementation((input: RequestInfo | URL) => {
    const url = String(input)

    if (url.endsWith('/auth/session')) {
      return Promise.resolve(errorEnvelope(401, 'unauthenticated', 'Not signed in.'))
    }

    if (url.includes('/auth/oauth/google/callback')) {
      return Promise.resolve(
        new Response(JSON.stringify(sessionPayload), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    }

    return Promise.resolve(errorEnvelope(404, 'not_found', 'Not found.'))
  })
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('GoogleCallbackPage', () => {
  it('completes sign-in and navigates to the dashboard', async () => {
    renderCallback('/auth/google/callback?code=google-code&state=state-token')

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()

    const callbackCall = fetchMock.mock.calls.find(([input]) =>
      String(input).includes('/auth/oauth/google/callback'),
    )
    expect(callbackCall).toBeDefined()
    expect(String(callbackCall?.[0])).toContain('code=google-code')
    expect(String(callbackCall?.[0])).toContain('state=state-token')
  })

  it('shows a useful error when callback parameters are missing', async () => {
    renderCallback('/auth/google/callback?state=state-token')

    expect(
      await screen.findByRole('heading', { name: 'Google sign-in failed' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/link is incomplete or has expired/i),
    ).toBeInTheDocument()

    expect(
      fetchMock.mock.calls.some(([input]) =>
        String(input).includes('/auth/oauth/google/callback'),
      ),
    ).toBe(false)
  })

  it('lets the user return to sign in after Google cancels authorization', async () => {
    const user = userEvent.setup()
    renderCallback('/auth/google/callback?error=access_denied')

    expect(await screen.findByText(/Google sign-in was cancelled/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /back to sign in/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
    })
  })
})
