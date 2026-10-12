import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ComponentProps } from 'react'
import { describe, expect, it } from 'vitest'
import { Logo } from '../../../src/components/navigation/Logo'
import { app } from '../../../src/config/app'

function renderLogo(props: ComponentProps<typeof Logo> = {}) {
  return render(
    <MemoryRouter>
      <Logo {...props} />
    </MemoryRouter>,
  )
}

describe('Logo', () => {
  it.each(['brand', 'auth', 'auth-login', 'auth-register', 'owner', 'portal'] as const)(
    'renders the wordmark for the %s variant',
    (variant) => {
      renderLogo({ variant })
      expect(screen.getByText(app.name)).toBeInTheDocument()
    },
  )

  it('links to the configured destination by default', () => {
    renderLogo({ to: '/terms' })
    expect(screen.getByRole('link', { name: app.name })).toHaveAttribute(
      'href',
      '/terms',
    )
  })

  it('renders a non-navigating mark when to is null', () => {
    renderLogo({ to: null })
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText(app.name)).toBeInTheDocument()
  })

  it('renders the portal mark as a bare document glyph', () => {
    const { container } = renderLogo({ to: null, variant: 'portal' })
    expect(container.querySelector('svg')).toBeInTheDocument()
    expect(screen.getByText(app.name)).toBeInTheDocument()
  })
})