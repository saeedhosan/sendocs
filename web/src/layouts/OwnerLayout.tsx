import { Link, Outlet, useLocation } from 'react-router-dom'
import { Container } from '../components/ui'
import { VerifyEmailBanner } from '../features/auth/components/VerifyEmailBanner'
import { OwnerHeader } from './components/OwnerHeader'
import { app } from '../config/app'
import { cn } from '../lib/cn'

export function OwnerLayout() {
  const pathname = useLocation().pathname
  const showFooter = pathname !== '/dashboard'
  const isCreateRequest = pathname === '/requests/new'
  const isRequestDetail = /^\/requests\/[^/]+$/.test(pathname) && !isCreateRequest
  const theme = pathname === '/dashboard'
    ? 'owner-dashboard-theme'
    : isCreateRequest
      ? 'create-request-theme'
      : isRequestDetail
        ? 'request-detail-theme'
        : ''

  return (
    <div className={cn("flex flex-col min-h-screen bg-canvas", theme)}>
      <OwnerHeader />
      <main className="[view-transition-name:page-content] flex-1 w-full">
        <Container>
          <VerifyEmailBanner />
        </Container>
        <Outlet />
      </main>
      {showFooter ? (
        <footer className="border-t border-border-subtle bg-surface py-4">
          <Container
            className={cn(
              'px-4 sm:px-6 flex items-center justify-between gap-4 text-xs',
              isRequestDetail
                ? 'text-neutral-500 min-[576px]:max-w-4xl min-[768px]:max-w-4xl min-[992px]:max-w-4xl min-[1200px]:max-w-4xl min-[1400px]:max-w-4xl'
                : 'text-ink-secondary min-[576px]:max-w-2xl min-[768px]:max-w-2xl min-[992px]:max-w-2xl min-[1200px]:max-w-2xl min-[1400px]:max-w-2xl',
            )}
          >
            <span>{app.name}</span>
            {isRequestDetail ? (
              <div className="flex items-center gap-4">
                <Link to="/contact" className="transition-colors hover:text-neutral-900">Help</Link>
                <Link to="/privacy" className="transition-colors hover:text-neutral-900">Privacy</Link>
              </div>
            ) : (
              <span>Direct client document intake</span>
            )}
          </Container>
        </footer>
      ) : null}
    </div>
  )
}
