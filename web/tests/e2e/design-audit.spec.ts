import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { expect, test } from '@playwright/test'
import type { Page, Route } from '@playwright/test'

const token = 'a'.repeat(43)
const now = Date.now()
const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000).toISOString()
const fiveHoursAgo = new Date(now - 5 * 60 * 60 * 1000).toISOString()
const eightHoursAgo = new Date(now - 8 * 60 * 60 * 1000).toISOString()
const yesterday = new Date(now - 24 * 60 * 60 * 1000).toISOString()
const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString()
const expiresAt = new Date(now + 11 * 24 * 60 * 60 * 1000).toISOString()
const sessionExpiresAt = new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString()

const sessionPayload = {
  user: {
    id: 'owner-audit',
    name: 'Alex Morgan',
    email: 'alex@example.com',
    emailVerifiedAt: twoHoursAgo,
  },
  csrfToken: 'csrf-audit',
  expiresAt: sessionExpiresAt,
}

const requestItems = [
  {
    id: 'detail-item-1',
    label: '2023 Form 1120-S Federal Return',
    position: 1,
    state: 'uploaded' as const,
    document: {
      id: 'detail-document-1',
      originalName: '2023_1120S_Signed.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 3565158,
      uploadedAt: twoHoursAgo,
      downloadUrl: 'https://example.invalid/2023_1120S_Signed.pdf',
    },
  },
  {
    id: 'detail-item-2',
    label: 'Year-End Balance Sheet & P&L',
    position: 2,
    state: 'uploaded' as const,
    document: {
      id: 'detail-document-2',
      originalName: 'Acme_Q4_Financials.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      sizeBytes: 1887437,
      uploadedAt: twoHoursAgo,
      downloadUrl: 'https://example.invalid/Acme_Q4_Financials.xlsx',
    },
  },
  {
    id: 'detail-item-3',
    label: 'Articles of Incorporation',
    position: 3,
    state: 'uploaded' as const,
    document: {
      id: 'detail-document-3',
      originalName: 'Articles_Inc_State.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 860160,
      uploadedAt: twoHoursAgo,
      downloadUrl: 'https://example.invalid/Articles_Inc_State.pdf',
    },
  },
  {
    id: 'detail-item-4',
    label: 'State Tax Exemption Certificate',
    position: 4,
    state: 'waiting' as const,
    document: null,
  },
  {
    id: 'detail-item-5',
    label: 'Shareholder Ownership Schedule',
    position: 5,
    state: 'waiting' as const,
    document: null,
  },
]

const portalItems = [
  {
    id: 'portal-item-1',
    label: 'Passport or Government ID',
    position: 1,
    state: 'uploaded' as const,
    document: {
      id: 'portal-document-1',
      originalName: 'passport_scan_2024.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 3565158,
      uploadedAt: twoHoursAgo,
      downloadUrl: 'https://example.invalid/passport.pdf',
    },
  },
  {
    id: 'portal-item-2',
    label: 'Certificate of Incorporation',
    position: 2,
    state: 'uploaded' as const,
    document: {
      id: 'portal-document-2',
      originalName: 'incorporation_cert_final.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1843200,
      uploadedAt: twoHoursAgo,
      downloadUrl: 'https://example.invalid/incorporation.pdf',
    },
  },
  {
    id: 'portal-item-3',
    label: 'Recent Bank Statement (Last 3 Months)',
    position: 3,
    state: 'waiting' as const,
    document: null,
  },
  {
    id: 'portal-item-4',
    label: 'Tax Return (Previous Fiscal Year)',
    position: 4,
    state: 'waiting' as const,
    document: null,
  },
  {
    id: 'portal-item-5',
    label: 'Utility Bill or Proof of Address',
    position: 5,
    state: 'waiting' as const,
    document: null,
  },
]

const summary = {
  id: 'req_audit',
  title: '2024 Corporate Tax Return — Acme Corp',
  status: 'waiting' as const,
  uploaded: 3,
  total: 5,
  lastActivityAt: twoHoursAgo,
  createdAt: twoHoursAgo,
  expiresAt,
  revokedAt: null,
}

const requestDetail = { ...summary, items: requestItems }

const requestPage = {
  data: [
    summary,
    {
      ...summary,
      id: 'req_complete',
      title: 'Q3 Financial Audit Documents',
      status: 'complete' as const,
      uploaded: 4,
      total: 4,
      lastActivityAt: yesterday,
    },
    {
      ...summary,
      id: 'req_kyc',
      title: 'KYC & Compliance Verification',
      uploaded: 0,
      total: 3,
      lastActivityAt: fiveHoursAgo,
    },
    {
      ...summary,
      id: 'req_estate',
      title: 'Estate Planning Records — Vance Trust',
      uploaded: 1,
      total: 4,
      lastActivityAt: eightHoursAgo,
    },
    {
      ...summary,
      id: 'req_vendor',
      title: 'W-9 & Vendor Banking Onboarding',
      status: 'complete' as const,
      uploaded: 2,
      total: 2,
      lastActivityAt: threeDaysAgo,
    },
  ],
  nextCursor: null,
}

const portalView = {
  title: 'Documents for Corporate Onboarding',
  status: 'waiting' as const,
  uploaded: 2,
  total: 5,
  lastActivityAt: twoHoursAgo,
  expiresAt,
  items: portalItems.map((item) => ({
    id: item.id,
    label: item.label,
    position: item.position,
    state: item.state,
    file: item.document
      ? {
          originalName: item.document.originalName,
          sizeBytes: item.document.sizeBytes,
          uploadedAt: item.document.uploadedAt,
        }
      : null,
  })),
}

const pages = [
  {
    name: 'landing',
    reference: 'ui/landing/home_page/code.html',
    path: '/',
    heading: 'Collect client documents without the back-and-forth.',
    authenticated: false,
  },
  {
    name: 'register',
    reference: 'ui/auth/account-create/code.html',
    path: '/register',
    heading: 'Create your account',
    authenticated: false,
  },
  {
    name: 'login',
    reference: 'ui/auth/account-login/code.html',
    path: '/login',
    heading: 'Sign in',
    authenticated: false,
  },
  {
    name: 'forgot-password',
    reference: 'ui/auth/password-forget/code.html',
    path: '/forgot-password',
    heading: 'Forgot your password?',
    authenticated: false,
  },
  {
    name: 'reset-password',
    reference: 'ui/auth/password-reset/code.html',
    path: '/reset-password?token=design-audit-token',
    heading: 'Create a new password',
    authenticated: false,
  },
  {
    name: 'change-password',
    reference: 'ui/auth/password-change/code.html',
    path: '/settings/password',
    heading: 'Change password',
    authenticated: true,
  },
  {
    name: 'privacy',
    reference: 'ui/landing/privacy_policy/code.html',
    path: '/privacy',
    heading: 'Privacy Policy',
    authenticated: false,
  },
  {
    name: 'terms',
    reference: 'ui/landing/terms_of_service/code.html',
    path: '/terms',
    heading: 'Terms of Service',
    authenticated: false,
  },
  {
    name: 'client-portal',
    reference: 'ui/client/code.html',
    path: `/portal/${token}`,
    heading: 'Documents for Corporate Onboarding',
    authenticated: false,
  },
  {
    name: 'owner-dashboard',
    reference: 'ui/owner/owner_dashboard/code.html',
    path: '/dashboard',
    heading: 'Document Requests',
    authenticated: true,
  },
  {
    name: 'new-request',
    reference: 'ui/owner/create_request/code.html',
    path: '/requests/new',
    heading: 'New document request',
    authenticated: true,
  },
  {
    name: 'request-detail',
    reference: 'ui/owner/request_details/code.html',
    path: '/requests/req_audit',
    heading: '2024 Corporate Tax Return — Acme Corp',
    authenticated: true,
  },
]

function json(status: number, body: unknown) {
  return {
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  }
}

async function stubApi(page: Page, isAuthenticated: () => boolean) {
  await page.route('**/api/v1/**', async (route: Route) => {
    const url = new URL(route.request().url())
    const pathname = url.pathname

    if (pathname === '/api/v1/auth/session') {
      return route.fulfill(
        isAuthenticated()
          ? json(200, sessionPayload)
          : json(401, {
              error: { code: 'unauthenticated', message: 'Not signed in.' },
            }),
      )
    }

    if (pathname === '/api/v1/requests/req_audit') {
      return route.fulfill(json(200, requestDetail))
    }

    if (pathname === '/api/v1/requests') {
      return route.fulfill(json(200, requestPage))
    }

    if (pathname.startsWith('/api/v1/portal/')) {
      return route.fulfill(json(200, portalView))
    }

    return route.fulfill(json(200, {}))
  })
}

async function waitForFonts(page: Page) {
  await page
    .waitForFunction(() => document.fonts.status === 'loaded', undefined, {
      timeout: 5000,
    })
    .catch(() => {})
}

test('captures desktop and mobile pairs for all committed UI references', async ({ page }) => {
  test.setTimeout(420_000)
  const outputDirectory = resolve(process.cwd(), 'test-results/design-audit')
  await mkdir(outputDirectory, { recursive: true })

  const viewports = [
    { name: 'desktop', width: 1440, height: 1000 },
    { name: 'mobile', width: 390, height: 844 },
  ]

  let authenticated = false
  await stubApi(page, () => authenticated)

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })

    for (const item of pages) {
      const referencePath = resolve(process.cwd(), '..', item.reference)
      await page.goto(pathToFileURL(referencePath).href, {
        waitUntil: 'domcontentloaded',
      })
      await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
      await waitForFonts(page)

      // Remove preview-only controls from the HTML mocks so screenshots compare
      // the actual page rather than the reference authoring/demo controls.
      if (item.name === 'client-portal') {
        await page.evaluate(() => document.querySelector('aside')?.remove())
      } else if (item.name === 'owner-dashboard') {
        await page.evaluate(() => {
          document.querySelector('button[title="Toggle empty state preview"]')?.remove()
        })
      } else if (item.name === 'new-request') {
        await page.evaluate(() => document.querySelector('#revealSuccessModal')?.remove())
      }

      await page.screenshot({
        path: resolve(outputDirectory, `${viewport.name}-${item.name}-reference.png`),
        fullPage: true,
        animations: 'disabled',
      })

      authenticated = item.authenticated
      await page.goto(item.path, { waitUntil: 'domcontentloaded' })
      await expect(
        page.getByRole('heading', { name: item.heading, exact: true }).first(),
      ).toBeVisible({ timeout: 15000 })
      if (item.name === 'owner-dashboard') {
        await expect(page.getByText(summary.title).first()).toBeVisible()
      }
      await waitForFonts(page)
      await page.screenshot({
        path: resolve(outputDirectory, `${viewport.name}-${item.name}-implementation.png`),
        fullPage: true,
        animations: 'disabled',
      })
    }
  }
})
