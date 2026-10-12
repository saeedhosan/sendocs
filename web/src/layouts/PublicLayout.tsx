import { Outlet, useLocation } from 'react-router-dom'
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
        isLanding ? 'bg-surface font-sans text-base leading-6 text-ink' : 'bg-canvas',
      )}
    >
      <PublicHeader />
      <main
        className={cn(
          '[view-transition-name:page-content] flex-1 w-full',
          isLanding && 'max-w-6xl mx-auto px-4 sm:px-6 pt-14 bg-surface',
          isDocumentPage && 'bg-surface',
        )}
      >
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  )
}
