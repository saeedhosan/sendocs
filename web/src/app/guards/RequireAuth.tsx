import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoadingState } from '../../components/feedback/LoadingState'
import { AuthLayout } from '../../layouts/AuthLayout'
import { useAuth } from '../providers/useAuth'

export function RequireAuth() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <AuthLayout>
        <LoadingState message="Checking your session..." />
      </AuthLayout>
    )
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  // One theme for every authenticated surface, so the shared header, controls,
  // and container render identically on the dashboard, request pages, and
  // settings without each page re-declaring a palette.
  return (
    <div className="owner-dashboard-theme">
      <Outlet />
    </div>
  )
}
