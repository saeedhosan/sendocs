import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../../../src/app/providers/AuthProvider'
import { ThemeProvider } from '../../../src/app/providers/ThemeProvider'
import { LoginPage } from '../../../src/features/auth/pages/LoginPage'

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

function errorEnvelope(
  status: number,
  code: string,
  message: string,
  details?: Record<string, string>,
): Response {
  return new Response(
    JSON.stringify({ error: { code, message, ...(details ? { details } : {}) } }),
    { status, headers: { 'Content-Type': 'application/json' } },
  )
}

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
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

    if (url.endsWith('/auth/login')) {
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

describe('LoginPage', () => {
  it('shows the designed sign-in content and a Google option', async () => {
    renderLogin()

    expect(
      await screen.findByRole('heading', { name: 'Sign in' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /continue with google/i }),
    ).toBeInTheDocument()
  })

  it('validates required fields before calling the API', async () => {
    const user = userEvent.setup()
    renderLogin()

    await screen.findByRole('heading', { name: 'Sign in' })
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))

    expect(await screen.findByText('Enter your email address.')).toBeInTheDocument()
    expect(screen.getByText('Enter your password.')).toBeInTheDocument()

    const loginCalls = fetchMock.mock.calls.filter((call) =>
      String(call[0]).endsWith('/auth/login'),
    )
    expect(loginCalls).toHaveLength(0)
  })

  it('signs in and navigates to the dashboard', async () => {
    const user = userEvent.setup()
    renderLogin()

    await screen.findByRole('heading', { name: 'Sign in' })
    await user.type(screen.getByLabelText('Email address'), 'alex@example.com')
    await user.type(screen.getByLabelText('Password'), 'correcthorsebattery')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))

    expect(
      await screen.findByRole('heading', { name: 'Dashboard' }),
    ).toBeInTheDocument()
  })

  it('surfaces invalid credentials from the API', async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input)

      if (url.endsWith('/auth/session')) {
        return Promise.resolve(errorEnvelope(401, 'unauthenticated', 'Not signed in.'))
      }

      return Promise.resolve(
        errorEnvelope(401, 'invalid_credentials', 'Email or password is incorrect.'),
      )
    })

    const user = userEvent.setup()
    renderLogin()

    await screen.findByRole('heading', { name: 'Sign in' })
    await user.type(screen.getByLabelText('Email address'), 'alex@example.com')
    await user.type(screen.getByLabelText('Password'), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))

    await waitFor(() => {
      expect(
        screen.getByText('Email or password is incorrect.'),
      ).toBeInTheDocument()
    })
  })
})
