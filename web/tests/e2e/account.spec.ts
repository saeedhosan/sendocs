import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import type { SessionPayload } from '../../src/features/auth/types.js'

const pictureUrl = 'https://lh3.googleusercontent.com/a/example'
const sessionPayload = {
  user: {
    id: '1',
    name: 'Alex Morgan',
    email: 'alex@example.com',
    emailVerifiedAt: null,
    pictureUrl,
  },
  csrfToken: 'csrf-123',
  expiresAt: '2099-01-01T00:00:00Z',
}

function json(status: number, body: unknown) {
  return {
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  }
}

async function signInAndOpenAccount(page: Page, payload: SessionPayload = sessionPayload) {
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill(json(200, payload)),
  )
  await page.goto('/login')
  await page.getByLabel('Email address').fill('alex@example.com')
  await page.getByLabel('Password', { exact: true }).fill('correcthorsebattery')
  await page.getByRole('button', { name: /^sign in$/i }).click()
  await page.goto('/account')
  await expect(page.getByRole('heading', { name: 'Account' })).toBeVisible()
}

test.describe('account profile', () => {
  test('shows profile details and does not persist the Google picture URL', async ({ page }) => {
    await signInAndOpenAccount(page)

    await expect(page.getByLabel('Full name')).toHaveValue('Alex Morgan')
    await expect(page.getByLabel('Email address')).toBeDisabled()
    await expect(page.getByRole('button', { name: 'Update profile' })).toBeDisabled()
    await expect(page.getByRole('main').getByRole('img', { name: 'Alex Morgan profile picture' })).toBeVisible()

    const storedSession = await page.evaluate(() =>
      sessionStorage.getItem('sendocs.owner-session.v1'),
    )
    expect(storedSession).not.toContain(pictureUrl)
  })

  test('falls back to a single initial when the Google profile image fails', async ({ page }) => {
    await page.route(pictureUrl, (route) => route.fulfill({ status: 404, body: '' }))
    await signInAndOpenAccount(page)

    await expect(
      page.getByRole('main').getByRole('img', { name: 'Alex Morgan profile picture' }),
    ).toHaveText('A')
  })

  test('updates the display name and refreshes the initials avatar', async ({ page }) => {
    const updatedSession = {
      ...sessionPayload,
      user: { ...sessionPayload.user, name: 'Alex Rivera', pictureUrl: null },
    }

    await page.route('**/api/v1/account', (route) =>
      route.fulfill(json(200, updatedSession)),
    )

    await signInAndOpenAccount(page, {
      ...sessionPayload,
      user: { ...sessionPayload.user, pictureUrl: null },
    })
    const nameField = page.getByLabel('Full name')
    await nameField.fill('Alex Rivera')
    await expect(page.getByRole('button', { name: 'Update profile' })).toBeEnabled()
    await page.getByRole('button', { name: 'Update profile' }).click()

    await expect(page.getByText('Your profile has been updated.')).toBeVisible()
    await expect(nameField).toHaveValue('Alex Rivera')
    await expect(page.getByRole('main').getByRole('img', { name: 'Alex Rivera profile picture' })).toHaveText('A')
  })
})
