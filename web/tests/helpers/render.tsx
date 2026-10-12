import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../src/app/providers/AuthProvider'
import type { SessionPayload } from '../../src/features/auth/types'
import { ThemeProvider } from '../../src/app/providers/ThemeProvider'

interface TestWrapperOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[]
  initialSession?: SessionPayload
}

export function renderWithProviders(
  ui: ReactElement,
  options: TestWrapperOptions = {}
) {
  const { initialEntries = ['/'], initialSession, ...renderOptions } = options

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider initialSession={initialSession}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </AuthProvider>
    </MemoryRouter>
  )

  return render(ui, { wrapper, ...renderOptions })
}

export { userEvent } from '@testing-library/user-event'
