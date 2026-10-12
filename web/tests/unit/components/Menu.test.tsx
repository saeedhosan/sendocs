import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { Menu } from '../../../src/components/navigation/Menu'
import { MENU_ITEMS } from '../../../src/components/navigation/menu-items'

function renderMenu(props: Partial<Parameters<typeof Menu>[0]> = {}) {
  return render(
    <MemoryRouter initialEntries={['/terms']}>
      <Menu {...props} />
    </MemoryRouter>,
  )
}

describe('Menu', () => {
  it('renders every item', () => {
    renderMenu()
    for (const item of MENU_ITEMS) {
      expect(screen.getByRole('link', { name: item.label })).toHaveAttribute(
        'href',
        item.to,
      )
    }
  })

  it('highlights the active route', () => {
    renderMenu()
    expect(
      screen.getByRole('link', { name: 'Terms' }).parentElement,
    ).not.toBeNull()
    expect(
      screen.getByRole('link', { name: 'Terms' }).className,
    ).toContain('text-ink-secondary')
  })

  it('draws separators between entries when provided', () => {
    const { container } = renderMenu({ separator: '·', leadingSeparator: false })
    expect(container.querySelectorAll('span[aria-hidden="true"]')).toHaveLength(
      MENU_ITEMS.length - 1,
    )
  })

  it('draws a leading separator as well when requested', () => {
    const { container } = renderMenu({ separator: '·', leadingSeparator: true })
    expect(
      container.querySelectorAll('span[aria-hidden="true"]'),
    ).toHaveLength(MENU_ITEMS.length)
  })

  it('skips the active highlight when disabled', () => {
    renderMenu({ highlightActive: false })
    expect(screen.getByRole('link', { name: 'Terms' }).className).not.toContain(
      'text-ink-secondary',
    )
  })
})