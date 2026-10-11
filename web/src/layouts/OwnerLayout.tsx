import { Link, Outlet, useLocation } from 'react-router-dom'
import { Container } from '../components/ui'
import { VerifyEmailBanner } from '../features/auth/components/VerifyEmailBanner'
import { OwnerHeader } from './components/OwnerHeader'
import { app } from '../config/app'

export function OwnerLayout() {
  const pathname = useLocation().pathname
  const showFooter = pathname !== '/dashboard'
  const isRequestDetail = /^\/requests\/[^/]+$/.test(pathname)

  return (
    <div className="flex flex-col min-h-screen bg-canvas">
      <OwnerHeader />
      <main className="[view-transition-name:page-content] flex-1 w-full">
        <Container>
          <VerifyEmailBanner />
        </Container>
        <Outlet />
      </main>
      {showFooter ? (
        <footer className="border-t border-border">
          <Container className="flex items-center justify-between gap-4">
            <span>{app.name}</span>
            {isRequestDetail ? (
              <div className="flex items-center gap-4">
                <Link to="/contact">Help</Link>
                <Link to="/privacy">Privacy</Link>
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
