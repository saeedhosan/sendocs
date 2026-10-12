import type { ReactNode } from 'react'
import { Container } from '../components/ui'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { OwnerHeader } from './components/OwnerHeader'
import { useAuth } from '../app/providers/useAuth'

const MAIN =
  '[view-transition-name:page-content] flex flex-1 flex-col items-center justify-center w-full px-4 py-6'
const CARD =
  'w-full max-w-md mx-auto my-12 p-8 bg-surface border border-border rounded-[10px] shadow-sm [&_input:not([type=checkbox]):not([type=radio])]:rounded-[10px] [&_button:not(.absolute)]:rounded-[10px]'

export type AuthLayoutProps = {
  children: ReactNode
  /** A single muted link at the top right, e.g. "Help" or "Back to account". */
  headerAction?: { label: string; to: string }
}

/**
 * The one container every auth page renders inside: the shared header (the
 * dashboard header once signed in, otherwise the minimal auth header), a
 * centered card, and the shared site footer — identical on login, register,
 * forgot/reset password, verify-email, and the settings pages.
 */
export function AuthLayout({ children, headerAction }: AuthLayoutProps) {
  const { status } = useAuth()
  const isAuthenticated = status === 'authenticated'

  return (
    <div className="flex flex-col min-h-screen bg-canvas-muted">
      {isAuthenticated ? (
        <OwnerHeader />
      ) : (
        <Header mode="auth" authAction={headerAction} />
      )}

      <main className={MAIN}>
        <Container className="flex flex-1 items-center justify-center w-full">
          <div className={CARD}>{children}</div>
        </Container>
      </main>

      <Footer />
    </div>
  )
}
