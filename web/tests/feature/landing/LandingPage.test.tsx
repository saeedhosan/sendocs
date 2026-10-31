import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LandingPage } from '../../../src/features/landing/pages/LandingPage'
import { GuestLayout } from '../../../src/layouts/GuestLayout'
import { renderWithProviders } from '../../helpers/render'

function renderHome() {
  return renderWithProviders(
    <Routes>
      <Route element={<GuestLayout />}>
        <Route index element={<LandingPage />} />
      </Route>
    </Routes>,
  )
}

describe('LandingPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('as a guest', () => {
    it('presents the hero and the sign-up actions', () => {
      renderHome()

      expect(
        screen.getByRole('heading', {
          name: 'Collect client documents without the back-and-forth.',
        }),
      ).toBeInTheDocument()

      expect(
        screen.getAllByRole('link', { name: 'Get started' })[0],
      ).toHaveAttribute('href', '/register')
      expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute(
        'href',
        '/login',
      )
    })

    it('shows the core features, the workflow, and the closing call to action', () => {
      renderHome()

      expect(
        screen.getByRole('heading', {
          name: 'Everything you need to collect documents.',
        }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('heading', { name: 'Private file storage' }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('heading', { name: 'How it works' }),
      ).toBeInTheDocument()
      expect(screen.getByText('01 - Create a request')).toBeInTheDocument()
      expect(
        screen.getByRole('heading', {
          name: 'Ready to simplify document collection?',
        }),
      ).toBeInTheDocument()
    })

    it('links to the legal pages from the footer', () => {
      renderHome()

      expect(screen.getByRole('link', { name: 'Terms' })).toHaveAttribute(
        'href',
        '/terms',
      )
      expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute(
        'href',
        '/privacy',
      )
      expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute(
        'href',
        '/contact',
      )
    })
  })

  describe('as an authenticated owner', () => {
    it('shows the profile menu button for authenticated owner', async () => {
      renderWithProviders(
        <Routes>
          <Route element={<GuestLayout />}>
            <Route index element={<LandingPage />} />
          </Route>
        </Routes>,
        {
          initialSession: {
            user: {
              id: '1',
              name: 'Alex Morgan',
              email: 'alex@example.com',
              emailVerifiedAt: null,
            },
            csrfToken: 'csrf-123',
            expiresAt: '2099-01-01T00:00:00Z',
          },
        },
      )

      expect(
        screen.getByRole('heading', {
          name: 'Collect client documents without the back-and-forth.',
        }),
      ).toBeInTheDocument()

      // Profile menu button should be present
      expect(
        await screen.findByRole('button', { name: "Alex Morgan's account menu" }),
      ).toBeInTheDocument()
      expect(
        screen.queryByRole('link', { name: 'Log in' }),
      ).not.toBeInTheDocument()
    })
  })
})
