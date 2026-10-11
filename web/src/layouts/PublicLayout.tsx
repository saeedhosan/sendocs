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
  const isLegalDocument = pathname === '/terms' || pathname === '/privacy'
  const isLanding = pathname === '/'

  return (
    <div className="flex flex-col min-h-screen bg-canvas">
      <PublicHeader />
      <main
        className={cn(
          '[view-transition-name:page-content] flex-1 w-full',
          isLanding && 'max-w-6xl mx-auto px-4 sm:px-6 pt-14 bg-surface',
          isLegalDocument && 'bg-surface',
        )}
      >
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  )
}
