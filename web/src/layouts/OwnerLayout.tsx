import { Outlet, useLocation } from 'react-router-dom'
import { Container } from '../components/ui'
import { VerifyEmailBanner } from '../features/auth/components/VerifyEmailBanner'
import { OwnerFooter } from './components/OwnerFooter'
import { OwnerHeader } from './components/OwnerHeader'
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
      {showFooter ? <OwnerFooter variant={isRequestDetail ? 'detail' : 'default'} /> : null}
    </div>
  )
}
