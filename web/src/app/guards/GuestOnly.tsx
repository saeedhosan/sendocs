import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../providers/useAuth'

export function GuestOnly() {
  const { status } = useAuth()

  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
