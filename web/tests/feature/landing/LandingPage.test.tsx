import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../../../src/app/providers/AuthProvider'
import { LandingPage } from '../../../src/features/landing/pages/LandingPage'
import { PublicLayout } from '../../../src/layouts/PublicLayout'
import { stubSession } from '../../helpers/auth'

function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <AuthProvider>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<LandingPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('LandingPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('as a guest', () => {
    beforeEach(() => {
      stubSession(false)
    })

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
      expect(screen.getByText('01 — Create a request')).toBeInTheDocument()
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
      expect(screen.queryByRole('link', { name: 'Contact' })).not.toBeInTheDocument()
    })
  })

  describe('as an authenticated owner', () => {
    beforeEach(() => {
      stubSession(true)
    })

    it('still renders the landing page with a dashboard action', async () => {
      renderHome()

      expect(
        screen.getByRole('heading', {
          name: 'Collect client documents without the back-and-forth.',
        }),
      ).toBeInTheDocument()

      expect(
        await screen.findByRole('link', { name: 'Dashboard' }),
      ).toHaveAttribute('href', '/dashboard')
      expect(
        screen.queryByRole('link', { name: 'Log in' }),
      ).not.toBeInTheDocument()
    })
  })
})
