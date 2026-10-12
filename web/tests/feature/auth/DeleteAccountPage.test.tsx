import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../../../src/app/providers/AuthProvider'
import { DeleteAccountPage } from '../../../src/features/auth/pages/DeleteAccountPage'

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

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function errorEnvelope(status: number, code: string, message: string): Response {
  return json(status, { error: { code, message } })
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/settings/delete']}>
      <AuthProvider>
        <Routes>
          <Route path="/settings/delete" element={<DeleteAccountPage />} />
          <Route path="/login" element={<h1>Sign in</h1>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

function deleteCalls() {
  return fetchMock.mock.calls.filter((call) =>
    String(call[0]).endsWith('/auth/account'),
  )
}

async function fillForm(password: string, confirm: string) {
  const user = userEvent.setup()
  await screen.findByRole('heading', { name: 'Delete account' })
  await screen.findByText('alex@example.com')

  await user.type(screen.getByLabelText('Password'), password)
  await user.type(screen.getByLabelText('Confirm your email'), confirm)
  await user.click(screen.getByRole('button', { name: /^delete account$/i }))
}

beforeEach(() => {
  fetchMock.mockReset()
  fetchMock.mockImplementation((input: RequestInfo | URL) => {
    const url = String(input)

    if (url.endsWith('/auth/session')) {
      return Promise.resolve(json(200, sessionPayload))
    }

    if (url.endsWith('/auth/account')) {
      return Promise.resolve(new Response(null, { status: 204 }))
    }

    return Promise.resolve(errorEnvelope(404, 'not_found', 'Not found.'))
  })
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('DeleteAccountPage', () => {
  it('shows the shared dashboard header for a signed-in visitor', async () => {
    renderPage()

    expect(
      await screen.findByRole('button', { name: "Alex Morgan's account menu" }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'Back to account' }),
    ).not.toBeInTheDocument()
  })

  it('requires the account email typed exactly as confirmation', async () => {
    renderPage()

    await fillForm('correcthorsebattery', 'someone@example.com')

    expect(
      await screen.findByText('Enter your account email exactly to confirm.'),
    ).toBeInTheDocument()
    expect(deleteCalls()).toHaveLength(0)
  })

  it('surfaces an incorrect password from the API', async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input)

      if (url.endsWith('/auth/session')) {
        return Promise.resolve(json(200, sessionPayload))
      }

      return Promise.resolve(
        errorEnvelope(401, 'invalid_credentials', 'Password is incorrect.'),
      )
    })

    renderPage()

    await fillForm('wrongpassword', 'alex@example.com')

    expect(await screen.findByText('Password is incorrect.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Delete account' })).toBeInTheDocument()
  })

  it('deletes the account and leaves the authenticated area', async () => {
    renderPage()

    await fillForm('correcthorsebattery', 'alex@example.com')

    expect(
      await screen.findByRole('heading', { name: 'Sign in' }),
    ).toBeInTheDocument()

    const calls = deleteCalls()
    expect(calls).toHaveLength(1)

    const [, init] = calls[0] as [string, RequestInit]
    expect(init.method).toBe('DELETE')
    expect(JSON.parse(init.body as string)).toEqual({
      password: 'correcthorsebattery',
      confirm: 'alex@example.com',
    })
  })
})
