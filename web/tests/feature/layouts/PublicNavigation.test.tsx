import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthLayout } from '../../../src/layouts/AuthLayout'
import { PublicFooter } from '../../../src/layouts/components/PublicFooter'
import { PublicHeader } from '../../../src/layouts/components/PublicHeader'

vi.mock('../../../src/app/providers/useAuth', () => ({
  useAuth: () => ({ status: 'guest' }),
}))

function renderAt(path: string, children: ReactNode) {
  return render(
    <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>,
  )
}

describe('public navigation reference fidelity', () => {
  it('shows the legal reference navigation without replacing Security with Contact', () => {
    renderAt('/privacy', <PublicHeader />)

    expect(screen.getByRole('link', { name: 'Terms' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Privacy' })).toBeInTheDocument()
    expect(screen.getByText('Security')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Security' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Contact' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('shows the legal reference footer without a Contact link', () => {
    renderAt('/terms', <PublicFooter />)

    expect(screen.getByText('© 2025 Sendocs Inc.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Terms' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Privacy' })).toBeInTheDocument()
    expect(screen.getByText('Security')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Security' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Contact' })).not.toBeInTheDocument()
  })

  it('shows Security as reference copy without inventing an auth route', () => {
    renderAt(
      '/login',
      <AuthLayout>
        <h1>Sign in</h1>
      </AuthLayout>,
    )

    expect(screen.getByText('Security')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Security' })).not.toBeInTheDocument()
  })

  it('preserves the reset-password footer order with Security first', () => {
    renderAt(
      '/reset-password',
      <AuthLayout footerVariant="reset-password">
        <h1>Create a new password</h1>
      </AuthLayout>,
    )

    const footer = screen.getByText('© 2025 Sendocs Technologies Inc.').parentElement
    expect(footer?.textContent).toContain('Security')
    expect(footer?.textContent?.indexOf('Security')).toBeLessThan(
      footer?.textContent?.indexOf('Privacy') ?? -1,
    )
  })
})
