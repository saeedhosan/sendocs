import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { app } from '../../../src/config/app'
import { PrivacyPolicyPage } from '../../../src/features/landing/pages/PrivacyPolicyPage'
import { TermsOfServicePage } from '../../../src/features/landing/pages/TermsOfServicePage'
import { GuestLayout } from '../../../src/layouts/GuestLayout'
import { stubSession } from '../../helpers/auth'
import { renderWithProviders } from '../../helpers/render'

function renderAt(path: string) {
  return renderWithProviders(
    <Routes>
      <Route element={<GuestLayout />}>
        <Route path="terms" element={<TermsOfServicePage />} />
        <Route path="privacy" element={<PrivacyPolicyPage />} />
      </Route>
    </Routes>,
    { initialEntries: [path] },
  )
}

beforeEach(() => {
  stubSession(false)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Terms of Service page', () => {
  it('renders the transcribed document and the shared header actions', () => {
    renderAt('/terms')

    expect(
      screen.getByRole('heading', { name: 'Terms of Service' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Last updated: January 15, 2026')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: '1. Scope of Service & Magic Links',
      }),
    ).toBeInTheDocument()

    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute(
      'href',
      '/login',
    )
    expect(
      screen.getByRole('link', { name: 'Get started' }),
    ).toHaveAttribute('href', '/register')
  })
})

describe('Privacy Policy page', () => {
  it('renders sections, list lead-ins, and the contact note', () => {
    renderAt('/privacy')

    expect(
      screen.getByRole('heading', { name: 'Privacy Policy' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: '2. Information We Collect (Minimal Scope)',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Account Identity Data:/)).toBeInTheDocument()

    expect(
      screen.getByRole('link', { name: app.emails.privacy }),
    ).toHaveAttribute('href', `mailto:${app.emails.privacy}`)
  })
})
