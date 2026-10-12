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

  return <Outlet />
}
