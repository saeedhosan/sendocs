import { Outlet, useLocation } from 'react-router-dom'
import { Container } from '../components/ui'
import { cn } from '../lib/cn'
import { PublicFooter } from './components/PublicFooter'
import { PublicHeader } from './components/PublicHeader'

/**
 * The shell for every public page: marketing header, content, and footer.
 * It only lays out; pages own their content.
 */
export function PublicLayout() {
  const { pathname } = useLocation()
  const isDocumentPage = pathname === '/terms' || pathname === '/privacy' || pathname === '/contact'
  const isLanding = pathname === '/'

  return (
    <div
      className={cn(
        'flex flex-col min-h-screen',
        isLanding ? 'bg-surface font-sans text-ink' : 'bg-canvas',
      )}
    >
      <PublicHeader />
      <main
        className={cn(
          '[view-transition-name:page-content] flex-1 w-full',
          isLanding && 'bg-surface',
          isDocumentPage && 'bg-surface',
        )}
      >
        <Container className={isLanding ? 'pt-14' : undefined}>
          <Outlet />
        </Container>
      </main>
      <PublicFooter />
    </div>
  )
}
