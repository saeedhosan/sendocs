import { Outlet } from 'react-router-dom'
import { VerifyEmailBanner } from '../features/auth/components/VerifyEmailBanner'
import { Header } from './components/Header'

/**
 * The one container for every dashboard page: the shared owner header and a
 * centered content column that owns the page padding, so the dashboard, create
 * request, and request detail pages share identical outer spacing. The palette
 * comes from the single theme applied by the auth guard.
 */
export function UserLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-canvas">
      <Header />
      <main className="[view-transition-name:page-content] flex-1 w-full">
        <div className="w-full mx-auto px-3 min-[576px]:max-w-135 min-[768px]:max-w-180 min-[992px]:max-w-240 min-[1200px]:max-w-285 min-[1400px]:max-w-330 flex flex-col gap-6 mt-20">
          <VerifyEmailBanner />
          <Outlet />
        </div>
      </main>
    </div>
  )
}
