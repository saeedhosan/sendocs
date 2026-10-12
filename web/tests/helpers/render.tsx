import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../src/app/providers/AuthProvider'
import { ThemeProvider } from '../../src/app/providers/ThemeProvider'

interface TestWrapperOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[]
}

export function renderWithProviders(
  ui: ReactElement,
  options: TestWrapperOptions = {}
) {
  const { initialEntries = ['/'], ...renderOptions } = options

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </AuthProvider>
    </MemoryRouter>
  )

  return render(ui, { wrapper, ...renderOptions })
}

export { userEvent } from '@testing-library/user-event'