import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../providers/useAuth'

export function RequireAuth() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
