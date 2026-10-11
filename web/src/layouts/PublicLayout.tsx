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

  return (
    <div className="flex flex-col min-h-screen bg-canvas">
      <PublicHeader />
      <main className={cn("[view-transition-name:page-content] flex-1 w-full", isLegalDocument && "bg-surface")}>
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  )
}
