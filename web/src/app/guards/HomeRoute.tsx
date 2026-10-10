import { Navigate } from 'react-router-dom'
import { LoadingState } from '../../components/feedback/LoadingState'
import { LandingPage } from '../../features/landing/pages/LandingPage'
import { useAuth } from '../providers/useAuth'

/**
 * The public home route. Guests see the marketing landing page; signed-in
 * owners continue to land on their dashboard.
 */
export function HomeRoute() {
  const { status } = useAuth()

  if (status === 'loading') {
    return <LoadingState message="Checking your session..." />
  }

  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />
  }

  return <LandingPage />
}
