import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

/*
 * Browser smoke tests for the Phase 2 owner journeys.
 *
 * The SPA is driven against a mocked /api/v1 contract; real API behaviour is
 * covered by the Laravel suite and the Vitest feature tests.
 */

const documentRequest = {
  id: 'r1',
  title: '2024 Corporate Tax Return',
  status: 'waiting',
  uploaded: 0,
  total: 1,
  lastActivityAt: null,
  createdAt: '2026-06-01T10:00:00Z',
  expiresAt: '2099-01-01T00:00:00Z',
  revokedAt: null,
  items: [
    {
      id: 'i1',
      label: 'Government-issued photo ID',
      position: 1,
      state: 'waiting',
      document: null,
    },
  ],
}

type Fulfill = {
  status: number
  contentType: string
  body: string
}

function json(status: number, body: unknown): Fulfill {
  return { status, contentType: 'application/json', body: JSON.stringify(body) }
}

async function stubAuthenticatedOwner(page: Page) {
  await page.route('**/api/v1/auth/session', (route) =>
    route.fulfill(
      json(200, {
        user: {
          id: '1',
          name: 'Alex Morgan',
          email: 'alex@example.com',
          emailVerifiedAt: null,
        },
        csrfToken: 'e2e-csrf',
        expiresAt: '2099-01-01T00:00:00Z',
      }),
    ),
  )
}

test.describe('owner requests', () => {
  test('an owner with no requests sees the empty state', async ({ page }) => {
    await stubAuthenticatedOwner(page)
    await page.route(/\/api\/v1\/requests(\?.*)?$/, (route) =>
      route.fulfill(json(200, { data: [], nextCursor: null })),
    )

    await page.goto('/dashboard')

    await expect(page.getByText('No document requests yet')).toBeVisible()
    await expect(
      page.getByRole('button', { name: /create request/i }),
    ).toBeVisible()
  })

  test('creating a request reveals the one-time client link', async ({ page }) => {
    await stubAuthenticatedOwner(page)
    await page.route(/\/api\/v1\/requests(\?.*)?$/, (route) =>
      route.fulfill(json(200, { data: [], nextCursor: null })),
    )
    await page.route('**/api/v1/requests', (route) =>
      route.fulfill(
        json(201, {
          request: documentRequest,
          link: {
            url: 'https://portal.example.com/r/abc123',
            expiresAt: '2099-01-01T00:00:00Z',
          },
        }),
      ),
    )

    await page.goto('/requests/new')

    await page.getByLabel('Title').fill('2024 Corporate Tax Return')
    await page
      .getByRole('textbox', { name: 'Document 1', exact: true })
      .fill('Government-issued photo ID')
    await page.getByRole('button', { name: /create request/i }).click()

    const dialog = page.getByRole('dialog', { name: 'Your request is ready.' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByLabel('Client portal link')).toHaveValue(
      'https://portal.example.com/r/abc123',
    )
    await expect(dialog.getByText('This link is shown only once.')).toBeVisible()
  })
})
