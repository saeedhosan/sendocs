import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { app } from '../../../src/config/app'
import { ContactPage } from '../../../src/features/landing/pages/ContactPage'
import { GuestLayout } from '../../../src/layouts/GuestLayout'
import { stubSession } from '../../helpers/auth'
import { renderWithProviders } from '../../helpers/render'

function renderContact() {
  return renderWithProviders(
    <Routes>
      <Route element={<GuestLayout />}>
        <Route path="contact" element={<ContactPage />} />
      </Route>
    </Routes>,
    { initialEntries: ['/contact'] },
  )
}

beforeEach(() => {
  stubSession(false)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ContactPage', () => {
  it('publishes the existing contact address', () => {
    renderContact()

    expect(
      screen.getByRole('heading', { name: 'Contact' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: app.emails.contact }),
    ).toHaveAttribute('href', `mailto:${app.emails.contact}`)
  })

  it('links to the other public pages from the header and footer', () => {
    renderContact()

    for (const link of screen.getAllByRole('link', { name: 'Terms' })) {
      expect(link).toHaveAttribute('href', '/terms')
    }
    for (const link of screen.getAllByRole('link', { name: 'Privacy' })) {
      expect(link).toHaveAttribute('href', '/privacy')
    }
  })
})
