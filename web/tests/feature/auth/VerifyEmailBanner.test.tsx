import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../../../src/app/providers/AuthProvider'
import { VerifyEmailBanner } from '../../../src/features/auth/components/VerifyEmailBanner'

const fetchMock = vi.fn()

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function session(verifiedAt: string | null): Response {
  return json(200, {
    user: {
      id: '1',
      name: 'Alex Morgan',
      email: 'alex@example.com',
      emailVerifiedAt: verifiedAt,
    },
    csrfToken: 'csrf-123',
    expiresAt: '2099-01-01T00:00:00Z',
  })
}

function renderBanner() {
  return render(
    <AuthProvider>
      <VerifyEmailBanner />
    </AuthProvider>,
  )
}

function resendCalls() {
  return fetchMock.mock.calls.filter((call) =>
    String(call[0]).endsWith('/auth/email/resend'),
  )
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('VerifyEmailBanner', () => {
  it('offers a resend and confirms it was sent for an unverified owner', async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input)

      if (url.endsWith('/auth/session')) {
        return Promise.resolve(session(null))
      }

      if (url.endsWith('/auth/email/resend')) {
        return Promise.resolve(json(202, {}))
      }

      return Promise.resolve(json(404, { error: { code: 'not_found', message: 'Not found.' } }))
    })

    renderBanner()

    expect(await screen.findByText('Verify your email address')).toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /resend email/i }))

    expect(await screen.findByText(/verification email sent/i)).toBeInTheDocument()
    expect(resendCalls()).toHaveLength(1)
  })

  it('renders nothing once the email is verified', async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input)

      if (url.endsWith('/auth/session')) {
        return Promise.resolve(session('2026-01-01T00:00:00Z'))
      }

      return Promise.resolve(json(404, { error: { code: 'not_found', message: 'Not found.' } }))
    })

    renderBanner()

    await waitFor(() => expect(sessionCalls()).toHaveLength(1))
    expect(screen.queryByText('Verify your email address')).not.toBeInTheDocument()
  })

  it('surfaces a failed resend', async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input)

      if (url.endsWith('/auth/session')) {
        return Promise.resolve(session(null))
      }

      if (url.endsWith('/auth/email/resend')) {
        return Promise.resolve(
          json(429, { error: { code: 'rate_limited', message: 'Too many requests. Try again later.' } }),
        )
      }

      return Promise.resolve(json(404, { error: { code: 'not_found', message: 'Not found.' } }))
    })

    renderBanner()

    await screen.findByText('Verify your email address')

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /resend email/i }))

    expect(
      await screen.findByText('Too many requests. Try again later.'),
    ).toBeInTheDocument()
  })
})

function sessionCalls() {
  return fetchMock.mock.calls.filter((call) =>
    String(call[0]).endsWith('/auth/session'),
  )
}
