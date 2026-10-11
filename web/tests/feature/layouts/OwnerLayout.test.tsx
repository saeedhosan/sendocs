import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { OwnerLayout } from '../../../src/layouts/OwnerLayout'
import themeStyles from '../../../src/styles/owner-themes.module.css'

vi.mock('../../../src/layouts/components/OwnerHeader', () => ({
  OwnerHeader: () => <header>Owner header</header>,
}))

vi.mock('../../../src/features/auth/components/VerifyEmailBanner', () => ({
  VerifyEmailBanner: () => null,
}))

function renderOwnerPath(path: string) {
  const result = render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<OwnerLayout />}>
          <Route path="*" element={<div>Page content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )

  return {
    ...result,
    root: result.container.firstElementChild as HTMLElement,
  }
}

describe('OwnerLayout route styling', () => {
  it('uses the new-request theme and reference footer copy', () => {
    const { root } = renderOwnerPath('/requests/new')

    expect(root.className).toContain(themeStyles.newRequestTheme)
    expect(screen.getByText('Direct client document intake')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Help' })).not.toBeInTheDocument()
  })

  it('uses the request-detail theme and help links for a request id', () => {
    const { root } = renderOwnerPath('/requests/req_123')

    expect(root.className).toContain(themeStyles.requestDetailTheme)
    expect(screen.getByRole('link', { name: 'Help' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Privacy' })).toBeInTheDocument()
    expect(screen.queryByText('Direct client document intake')).not.toBeInTheDocument()
  })

  it('uses the wider dashboard theme and hides its footer', () => {
    const { root } = renderOwnerPath('/dashboard')

    expect(root.className).toContain(themeStyles.dashboardTheme)
    expect(screen.queryByText('Direct client document intake')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Help' })).not.toBeInTheDocument()
  })
})
