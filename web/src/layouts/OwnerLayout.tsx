import { Outlet } from 'react-router-dom'
import { Container } from '../components/ui'
import { VerifyEmailBanner } from '../features/auth/components/VerifyEmailBanner'
import { OwnerHeader } from './components/OwnerHeader'

/**
 * The one container for every dashboard page: the shared owner header and a
 * centered content column that owns the page padding, so the dashboard, create
 * request, and request detail pages share identical outer spacing. The palette
 * comes from the single theme applied by the auth guard.
 */
export function OwnerLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-canvas">
      <OwnerHeader />
      <main className="[view-transition-name:page-content] flex-1 w-full">
        <Container className="flex flex-col gap-6 py-6 sm:py-8">
          <VerifyEmailBanner />
          <Outlet />
        </Container>
      </main>
    </div>
  )
}
