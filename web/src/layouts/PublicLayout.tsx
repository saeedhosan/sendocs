import { Outlet } from 'react-router-dom'
import { PublicFooter } from './components/PublicFooter'
import { PublicHeader } from './components/PublicHeader'

/**
 * The shell for every public page: marketing header, content, and footer.
 * It only lays out; pages own their content.
 */
export function PublicLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <PublicHeader />
      <main className="[view-transition-name:page-content] flex-1 w-full">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  )
}
