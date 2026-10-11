import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../../../src/app/providers/AuthProvider'
import { RegisterPage } from '../../../src/features/auth/pages/RegisterPage'

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

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <AuthProvider>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<h1>Dashboard</h1>} />
        </Routes>
      </AuthProvider>
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

    if (url.endsWith('/auth/register')) {
      return Promise.resolve(
        new Response(JSON.stringify(sessionPayload), {
          status: 201,
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

describe('RegisterPage', () => {
  it('shows the password requirements and a Google option', async () => {
    renderRegister()

    expect(
      await screen.findByRole('heading', { name: 'Create your account' }),
    ).toBeInTheDocument()
    expect(screen.getByText('At least 8 characters')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /sign up with google/i }),
    ).toBeInTheDocument()
  })

  it('blocks a short password before calling the API', async () => {
    const user = userEvent.setup()
    renderRegister()

    await screen.findByRole('heading', { name: 'Create your account' })
    await user.type(screen.getByLabelText('Full name'), 'Alex Morgan')
    await user.type(screen.getByLabelText('Work email address'), 'alex@example.com')
    await user.type(screen.getByLabelText('Password'), 'short')
    await user.type(screen.getByLabelText('Confirm password'), 'short')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(
      await screen.findByText('Password must be at least 8 characters.'),
    ).toBeInTheDocument()

    const registerCalls = fetchMock.mock.calls.filter((call) =>
      String(call[0]).endsWith('/auth/register'),
    )
    expect(registerCalls).toHaveLength(0)
  })

  it('registers and navigates to the dashboard', async () => {
    const user = userEvent.setup()
    renderRegister()

    await screen.findByRole('heading', { name: 'Create your account' })
    await user.type(screen.getByLabelText('Full name'), 'Alex Morgan')
    await user.type(screen.getByLabelText('Work email address'), 'alex@example.com')
    await user.type(screen.getByLabelText('Password'), 'correcthorsebattery')
    await user.type(screen.getByLabelText('Confirm password'), 'correcthorsebattery')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(
      await screen.findByRole('heading', { name: 'Dashboard' }),
    ).toBeInTheDocument()
  })

  it('shows a server-side field error returned by the API', async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input)

      if (url.endsWith('/auth/session')) {
        return Promise.resolve(errorEnvelope(401, 'unauthenticated', 'Not signed in.'))
      }

      return Promise.resolve(
        new Response(
          JSON.stringify({
            error: {
              code: 'validation_failed',
              message: 'The given data was invalid.',
              details: { email: 'The email has already been taken.' },
            },
          }),
          { status: 422, headers: { 'Content-Type': 'application/json' } },
        ),
      )
    })

    const user = userEvent.setup()
    renderRegister()

    await screen.findByRole('heading', { name: 'Create your account' })
    await user.type(screen.getByLabelText('Full name'), 'Alex Morgan')
    await user.type(screen.getByLabelText('Work email address'), 'taken@example.com')
    await user.type(screen.getByLabelText('Password'), 'correcthorsebattery')
    await user.type(screen.getByLabelText('Confirm password'), 'correcthorsebattery')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(
      await screen.findByText('The email has already been taken.'),
    ).toBeInTheDocument()
  })
})
