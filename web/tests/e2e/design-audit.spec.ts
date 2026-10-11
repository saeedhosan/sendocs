import { mkdir, writeFile } from 'node:fs/promises'
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
    name: 'John Doe',
    email: 'john@acmepartners.com',
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
  uploaded: 3,
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

    if (pathname === '/api/v1/requests' && route.request().method() === 'POST') {
      return route.fulfill(
        json(201, {
          request: requestDetail,
          link: {
            url: 'https://sendocs.app/portal/3b8f9e29a7c414d8eb11e9f420b87a',
            expiresAt,
          },
        }),
      )
    }

    if (pathname === '/api/v1/requests' && route.request().method() === 'GET') {
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
      timeout: 3000,
    })
    .catch(() => {})
}

async function captureTypography(page: Page) {
  return page.evaluate(() => {
    const selectors = ['body', 'header', 'main', 'footer', 'h1', 'h2', 'h3', 'p', 'label', 'button', 'input', 'section', 'article', '.card', '.main', '.footerInner', '.page', '.form', '.linkPanel', '.itemRow', '.panel', '[role="dialog"]']
    return selectors.flatMap((selector) =>
      [...document.querySelectorAll<HTMLElement>(selector)].map((element, index) => {
        const style = getComputedStyle(element)
        const rect = element.getBoundingClientRect()
        const text = (element.innerText || element.getAttribute('placeholder') || '')
          .replace(/\s+/g, ' ')
          .trim()
        return {
          selector,
          index,
          text: text.slice(0, 120),
          x: Math.round(rect.x * 10) / 10,
          y: Math.round(rect.y * 10) / 10,
          width: Math.round(rect.width * 10) / 10,
          height: Math.round(rect.height * 10) / 10,
          fontFamily: style.fontFamily,
          fontSize: style.fontSize,
          lineHeight: style.lineHeight,
          fontWeight: style.fontWeight,
          color: style.color,
          backgroundColor: style.backgroundColor,
          padding: style.padding,
          margin: style.margin,
        }
      }),
    )
  })
}

test('captures desktop and mobile pairs for all committed UI references', async ({ page }) => {
  test.setTimeout(420_000)
  const outputDirectory = resolve(process.cwd(), 'test-results/design-audit')
  await mkdir(outputDirectory, { recursive: true })

  const viewports = [
    { name: 'desktop', width: 1440, height: 1000 },
    { name: 'mobile', width: 390, height: 844 },
  ]

  const typographyAudit: Array<{ viewport: string; page: string; side: string; elements: unknown[] }> = []
  let authenticated = false
  await stubApi(page, () => authenticated)

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })

    for (const item of pages) {
      const referencePath = resolve(process.cwd(), '..', item.reference)
      await page.goto(pathToFileURL(referencePath).href, {
        waitUntil: 'domcontentloaded',
      })
      await waitForFonts(page)

      // Capture the reference's creation-success modal before hiding the
      // prototype's always-visible preview overlay for the resting-page shot.
      if (item.name === 'new-request') {
        await page.mouse.move(0, 0)
        typographyAudit.push({
          viewport: viewport.name,
          page: item.name,
          side: 'link-reveal-reference',
          elements: await captureTypography(page),
        })
        await page.screenshot({
          path: resolve(outputDirectory, `${viewport.name}-new-request-link-reveal-reference.png`),
          animations: 'disabled',
        })
      }

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

      typographyAudit.push({
        viewport: viewport.name,
        page: item.name,
        side: 'reference',
        elements: await captureTypography(page),
      })
      await page.mouse.move(0, 0)
      await page.screenshot({
        path: resolve(outputDirectory, `${viewport.name}-${item.name}-reference.png`),
        fullPage: true,
        animations: 'disabled',
      })

      if (item.name === 'forgot-password') {
        await page.evaluate(() => {
          document.getElementById('request-state')?.classList.add('hidden')
          document.getElementById('confirmation-state')?.classList.remove('hidden')
          const target = document.getElementById('target-email')
          if (target) target.textContent = 'alex@example.com'
        })
        await expect(page.getByRole('heading', { name: 'Check your inbox' })).toBeVisible()
        typographyAudit.push({
          viewport: viewport.name,
          page: 'forgot-password-success',
          side: 'reference',
          elements: await captureTypography(page),
        })
        await page.mouse.move(0, 0)
        await page.screenshot({
          path: resolve(outputDirectory, `${viewport.name}-forgot-password-success-reference.png`),
          fullPage: true,
          animations: 'disabled',
        })
      }

      if (item.name === 'request-detail') {
        const referenceDialogs = [
          {
            name: 'revoke-dialog',
            triggerSelector: 'button[onclick*="revoke-modal"]',
            selector: '#revoke-modal',
          },
          {
            name: 'delete-request-dialog',
            triggerSelector: 'button[onclick*="delete-modal"]',
            selector: '#delete-modal',
          },
          {
            name: 'delete-document-dialog',
            triggerSelector: 'button[onclick^="openDocDeleteModal"]',
            selector: '#delete-file-modal',
          },
        ]

        for (const dialog of referenceDialogs) {
          const trigger = page.locator(dialog.triggerSelector)
          await trigger.first().click()
          await expect(page.locator(dialog.selector)).toBeVisible()
          await page.evaluate(() => window.scrollTo(0, 0))
          await page.mouse.move(0, 0)
          typographyAudit.push({
            viewport: viewport.name,
            page: `request-detail-${dialog.name}`,
            side: 'reference',
            elements: await captureTypography(page),
          })
          await page.screenshot({
            path: resolve(outputDirectory, `${viewport.name}-request-detail-${dialog.name}-reference.png`),
            animations: 'disabled',
          })
          await page.locator(dialog.selector).getByRole('button', { name: 'Cancel', exact: true }).click()
        }
      }

      authenticated = item.authenticated
      await page.goto(item.path, { waitUntil: 'domcontentloaded' })
      await expect(
        page.getByRole('heading', { name: item.heading, exact: true }).first(),
      ).toBeVisible({ timeout: 15000 })

      if (item.name === 'reset-password') {
        await page.getByLabel('New password', { exact: true }).fill('abcdefghijkl')
        await page.getByLabel('Confirm new password', { exact: true }).fill('abcdefghijkl')
      }

      if (item.name === 'new-request') {
        await page.getByLabel('Title').fill('2024 Corporate Tax Return — Acme Corp')
        await page.getByRole('textbox', { name: 'Document 1', exact: true }).fill('Government-issued photo ID')
        await page.getByRole('button', { name: 'Add item' }).click()
        await page.getByRole('textbox', { name: 'Document 2', exact: true }).fill('W-2 / 1099 Forms or Profit & Loss Statement')
        await page.getByRole('button', { name: 'Add item' }).click()
        await page.getByRole('textbox', { name: 'Document 3', exact: true }).fill('Articles of Incorporation & Proof of Address')
      }

      if (item.name === 'client-portal') {
        // The HTML reference deliberately depicts an in-flight transfer and a
        // local size-precheck failure. Reproduce those transient states without
        // sending a real file or depending on network timing.
        await page.evaluate(() => {
          XMLHttpRequest.prototype.send = function () {
            window.setTimeout(() => {
              this.upload.dispatchEvent(
                new ProgressEvent('progress', {
                  lengthComputable: true,
                  loaded: 67,
                  total: 100,
                }),
              )
            }, 0)
          }
        })
        await page
          .getByLabel('Choose a file for Recent Bank Statement (Last 3 Months)')
          .setInputFiles({
            name: 'bank_statement.pdf',
            mimeType: 'application/pdf',
            buffer: Buffer.from('%PDF-1.4 design audit fixture'),
          })
        await expect(page.getByText('Uploading · 67%', { exact: true })).toBeVisible()
        await page
          .getByLabel('Choose a file for Tax Return (Previous Fiscal Year)')
          .setInputFiles({
            name: 'oversized_tax_return.pdf',
            mimeType: 'application/pdf',
            buffer: Buffer.alloc(26 * 1024 * 1024),
          })
        await expect(page.getByText('Upload failed · The file is larger than 25 MB')).toBeVisible()
      }

      if (item.name === 'owner-dashboard') {
        await expect(page.getByText(summary.title).first()).toBeVisible()
      }

      // Reference screenshots show the resting state, not keyboard focus left
      // behind by the test setup that fills forms or selects files.
      await page.evaluate(() => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur()
        }
      })
      await waitForFonts(page)
      typographyAudit.push({
        viewport: viewport.name,
        page: item.name,
        side: 'implementation',
        elements: await captureTypography(page),
      })
      await page.mouse.move(0, 0)
      await page.screenshot({
        path: resolve(outputDirectory, `${viewport.name}-${item.name}-implementation.png`),
        fullPage: true,
        animations: 'disabled',
      })

      if (item.name === 'forgot-password') {
        await page.getByLabel('Email address', { exact: true }).fill('alex@example.com')
        await page.getByRole('button', { name: 'Send reset link', exact: true }).click()
        await expect(page.getByRole('heading', { name: 'Check your inbox' })).toBeVisible()
        await page.evaluate(() => {
          if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
        })
        typographyAudit.push({
          viewport: viewport.name,
          page: 'forgot-password-success',
          side: 'implementation',
          elements: await captureTypography(page),
        })
        await page.mouse.move(0, 0)
        await page.screenshot({
          path: resolve(outputDirectory, `${viewport.name}-forgot-password-success-implementation.png`),
          fullPage: true,
          animations: 'disabled',
        })
      }

      if (item.name === 'new-request') {
        await page.getByRole('button', { name: 'Create request', exact: true }).click()
        const dialog = page.getByRole('dialog', { name: 'Your request is ready.' })
        await expect(dialog).toBeVisible()
        await page.evaluate(() => {
          const input = document.querySelector('[role="dialog"] input')
          if (input instanceof HTMLInputElement) {
            input.setSelectionRange(0, 0)
            input.blur()
          }
          window.scrollTo(0, 0)
        })
        typographyAudit.push({
          viewport: viewport.name,
          page: 'new-request-link-reveal',
          side: 'implementation',
          elements: await captureTypography(page),
        })
        await page.mouse.move(0, 0)
        await page.screenshot({
          path: resolve(outputDirectory, `${viewport.name}-new-request-link-reveal-implementation.png`),
          animations: 'disabled',
        })
        await dialog.getByRole('button', { name: 'Done', exact: true }).click()
      }

      if (item.name === 'request-detail') {
        const implementationDialogs = [
          { name: 'revoke-dialog', trigger: 'Revoke link' },
          { name: 'delete-request-dialog', trigger: 'Delete request' },
          { name: 'delete-document-dialog', trigger: 'Delete' },
        ]

        for (const dialogConfig of implementationDialogs) {
          const trigger = page.getByRole('button', { name: dialogConfig.trigger, exact: true })
          if (dialogConfig.name === 'delete-document-dialog') {
            await page.evaluate(() => window.scrollTo(0, 0))
            await trigger.first().click()
          } else {
            await trigger.click()
          }
          const dialog = page.getByRole('dialog')
          await expect(dialog).toBeVisible()
          await page.evaluate(() => window.scrollTo(0, 0))
          await page.mouse.move(0, 0)
          typographyAudit.push({
            viewport: viewport.name,
            page: `request-detail-${dialogConfig.name}`,
            side: 'implementation',
            elements: await captureTypography(page),
          })
          await page.screenshot({
            path: resolve(outputDirectory, `${viewport.name}-request-detail-${dialogConfig.name}-implementation.png`),
            animations: 'disabled',
          })
          await dialog.getByRole('button', { name: 'Cancel', exact: true }).click()
        }
      }

      if (item.name === 'owner-dashboard') {
        await page.getByRole('button', { name: /Waiting/ }).click()
        await expect(page.getByText('KYC & Compliance Verification')).toBeVisible()
        await expect(page.getByText('Q3 Financial Audit Documents')).toHaveCount(0)
        const search = page.getByRole('searchbox', { name: 'Search requests' })
        await search.fill('Estate Planning')
        await expect(page.getByText('Estate Planning Records — Vance Trust')).toBeVisible()
        await expect(page.getByText('KYC & Compliance Verification')).toHaveCount(0)
      }
    }
  }

  await writeFile(
    resolve(outputDirectory, 'typography-audit.json'),
    JSON.stringify(typographyAudit, null, 2),
  )
})
