import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { PrivacyPolicyPage } from '../../../src/features/landing/pages/PrivacyPolicyPage'
import { TermsOfServicePage } from '../../../src/features/landing/pages/TermsOfServicePage'
import { PublicLayout } from '../../../src/layouts/PublicLayout'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="terms" element={<TermsOfServicePage />} />
          <Route path="privacy" element={<PrivacyPolicyPage />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('Terms of Service page', () => {
  it('renders the transcribed document and the legal navigation', () => {
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

    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/login',
    )
    expect(screen.queryByRole('link', { name: 'Log in' })).not.toBeInTheDocument()
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
      screen.getByRole('link', { name: 'privacy@sendocs.internal' }),
    ).toHaveAttribute('href', 'mailto:privacy@sendocs.internal')
  })
})
