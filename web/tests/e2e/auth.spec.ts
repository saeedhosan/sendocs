import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

/*
 * End-to-end coverage for the Phase 1 auth journeys.
 *
 * These are browser smoke tests for the client-side flows, so the API is
 * faked at the network boundary: the SPA talks to a mocked /api/v1 contract
 * instead of the compose stack. Real API behaviour is exercised by the
 * Laravel suite and the Vitest feature tests.
 */

const sessionPayload = {
  user: {
    id: '1',
    name: 'Alex Morgan',
    email: 'alex@example.com',
    emailVerifiedAt: null,
  },
  csrfToken: 'e2e-csrf',
  expiresAt: '2099-01-01T00:00:00Z',
}

const unauthEnvelope = {
  error: { code: 'unauthenticated', message: 'Not signed in.' },
}

function json(status: number, body: unknown): {
  status: number
  contentType: string
  body: string
} {
  return { status, contentType: 'application/json', body: JSON.stringify(body) }
}

async function stubUnauthenticated(page: Page) {
  await page.route('**/api/v1/auth/session', (route) =>
    route.fulfill(json(401, unauthEnvelope)),
  )
}

test.describe('unauthenticated shell', () => {
  test.beforeEach(async ({ page }) => {
    await stubUnauthenticated(page)
  })

  test('a guest is redirected from the dashboard to sign in', async ({ page }) => {
    await page.goto('/dashboard')

    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  })

  test('the sign-in form reports required fields', async ({ page }) => {
    await page.goto('/login')

    await page.getByRole('button', { name: /^sign in$/i }).click()

    await expect(page.getByText('Enter your email address.')).toBeVisible()
    await expect(page.getByText('Enter your password.')).toBeVisible()
  })

  test('a guest can reach account creation', async ({ page }) => {
    await page.goto('/login')

    await page.getByRole('link', { name: /create account/i }).click()

    await expect(page).toHaveURL(/\/register$/)
    await expect(
      page.getByRole('heading', { name: 'Create your account' }),
    ).toBeVisible()
  })

  test('forgot password confirms the reset email was requested', async ({ page }) => {
    await page.route('**/api/v1/auth/password/forgot', (route) =>
      route.fulfill({ status: 202, contentType: 'application/json', body: '{}' }),
    )

    await page.goto('/forgot-password')

    await page.getByLabel('Email address').fill('someone@example.com')
    await page.getByRole('button', { name: /send reset link/i }).click()

    await expect(
      page.getByRole('heading', { name: 'Check your inbox' }),
    ).toBeVisible()
  })
})

test.describe('authenticated shell', () => {
  test('sign in moves a guest to the dashboard', async ({ page }) => {
    await page.route('**/api/v1/auth/session', (route) =>
      route.fulfill(json(401, unauthEnvelope)),
    )
    await page.route('**/api/v1/auth/login', (route) =>
      route.fulfill(json(200, sessionPayload)),
    )
    await page.route(/\/api\/v1\/requests(\?.*)?$/, (route) =>
      route.fulfill(json(200, { data: [], nextCursor: null })),
    )

    await page.goto('/login')

    await page.getByLabel('Email address').fill('alex@example.com')
    await page.getByLabel('Password', { exact: true }).fill('correcthorsebattery')
    await page.getByRole('button', { name: /^sign in$/i }).click()

    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(
      page.getByText('No document requests yet'),
    ).toBeVisible()
  })

  test('an owner can delete their account', async ({ page }) => {
    await page.route('**/api/v1/auth/session', (route) =>
      route.fulfill(json(200, sessionPayload)),
    )
    await page.route('**/api/v1/auth/account', (route) =>
      route.fulfill({ status: 204 }),
    )

    await page.goto('/settings/delete')

    await expect(
      page.getByRole('heading', { name: 'Delete account' }),
    ).toBeVisible()

    await page.getByLabel('Password', { exact: true }).fill('correcthorsebattery')
    await page.getByLabel('Confirm your email').fill(sessionPayload.user.email)
    await page.getByRole('button', { name: /^delete account$/i }).click()

    await expect(page).toHaveURL(/\/login$/)
    await expect(
      page.getByRole('heading', { name: 'Sign in' }),
    ).toBeVisible()
  })

  test('an unverified owner can resend the verification email', async ({ page }) => {
    await page.route('**/api/v1/auth/session', (route) =>
      route.fulfill(json(200, sessionPayload)),
    )
    await page.route(/\/api\/v1\/requests(\?.*)?$/, (route) =>
      route.fulfill(json(200, { data: [], nextCursor: null })),
    )
    await page.route('**/api/v1/auth/email/resend', (route) =>
      route.fulfill(json(202, {})),
    )

    await page.goto('/dashboard')

    await expect(page.getByText('Verify your email address')).toBeVisible()
    await page.getByRole('button', { name: /resend email/i }).click()
    await expect(page.getByText(/verification email sent/i)).toBeVisible()
  })
})