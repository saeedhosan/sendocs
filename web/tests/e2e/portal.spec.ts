import { Buffer } from 'node:buffer'
import { expect, test } from '@playwright/test'
import type { Page, Route } from '@playwright/test'

/*
 * Browser smoke tests for the Phase 3 client portal.
 *
 * The SPA is driven against a mocked /api/v1 contract; real API behaviour is
 * covered by the Laravel suite and the Vitest feature tests.
 */

const token = 'a'.repeat(43)

const waitingView = {
  title: 'Documents for Corporate Onboarding',
  status: 'waiting',
  uploaded: 0,
  total: 1,
  lastActivityAt: null,
  expiresAt: '2099-01-01T00:00:00Z',
  items: [
    {
      id: 'i1',
      label: 'Government-issued photo ID',
      position: 1,
      state: 'waiting',
      file: null,
    },
  ],
}

const uploadedView = {
  ...waitingView,
  uploaded: 1,
  status: 'complete',
  items: [
    {
      id: 'i1',
      label: 'Government-issued photo ID',
      position: 1,
      state: 'uploaded',
      file: {
        originalName: 'passport.pdf',
        sizeBytes: 7,
        uploadedAt: '2026-06-01T10:00:00Z',
      },
    },
  ],
}

function json(route: Route, status: number, body: unknown) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}

async function stubSession(page: Page) {
  await page.route('**/api/v1/auth/session', (route) =>
    json(route, 401, { error: { code: 'unauthenticated', message: 'No session.' } }),
  )
}

test('a client uploads a required document', async ({ page }) => {
  await stubSession(page)
  await page.route('**/api/v1/portal/**', (route) => {
    if (route.request().method() === 'POST') {
      return json(route, 200, uploadedView)
    }

    return json(route, 200, waitingView)
  })

  await page.goto(`/portal/${token}`)

  await expect(
    page.getByRole('heading', { name: 'Documents for Corporate Onboarding' }),
  ).toBeVisible()
  await expect(page.getByText('0 of 1 uploaded')).toBeVisible()

  await page
    .getByLabel('Choose a file for Government-issued photo ID')
    .setInputFiles({
      name: 'passport.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('content'),
    })

  await expect(page.getByRole('status', { name: 'Upload complete' })).toBeVisible()
  await expect(page.getByText('All documents received')).toBeVisible()
})

test('an invalid link shows the dead-link screen with no request data', async ({
  page,
}) => {
  await stubSession(page)
  await page.route('**/api/v1/portal/**', (route) =>
    json(route, 410, {
      error: { code: 'invalid_link', message: 'This link is no longer valid.' },
    }),
  )

  await page.goto(`/portal/${token}`)

  await expect(page.getByText('This link is no longer active')).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Documents for Corporate Onboarding' }),
  ).toHaveCount(0)
  await expect(page.getByText('Government-issued photo ID')).toHaveCount(0)
})
