import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { LandingPage } from '../../../src/features/landing/pages/LandingPage'
import { PublicLayout } from '../../../src/layouts/PublicLayout'

function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<LandingPage />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('LandingPage', () => {
  it('presents the hero and the two conversion actions', () => {
    renderHome()

    expect(
      screen.getByRole('heading', {
        name: 'Collect client documents without the back-and-forth.',
      }),
    ).toBeInTheDocument()

    const getStarted = screen.getAllByRole('link', { name: 'Get started' })
    expect(getStarted.length).toBeGreaterThan(0)
    expect(getStarted[0]).toHaveAttribute('href', '/register')
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute(
      'href',
      '/login',
    )
  })

  it('lists the core features and the workflow', () => {
    renderHome()

    expect(
      screen.getByRole('heading', {
        name: 'Everything you need to collect documents.',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Secure magic links' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Private file storage' }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('heading', { name: 'How it works' }),
    ).toBeInTheDocument()
    expect(screen.getByText('01 — Create a request')).toBeInTheDocument()
  })

  it('closes with the call to action and the legal footer links', () => {
    renderHome()

    expect(
      screen.getByRole('heading', {
        name: 'Ready to simplify document collection?',
      }),
    ).toBeInTheDocument()

    expect(screen.getByRole('link', { name: 'Terms' })).toHaveAttribute(
      'href',
      '/terms',
    )
    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute(
      'href',
      '/privacy',
    )
  })
})
