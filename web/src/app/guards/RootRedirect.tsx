import { Navigate } from 'react-router-dom'
import { LoadingState } from '../../components/feedback/LoadingState'
import { AuthLayout } from '../../layouts/AuthLayout'
import { useAuth } from '../providers/useAuth'

export function RootRedirect() {
  const { status } = useAuth()

  if (status === 'loading') {
    return (
      <AuthLayout>
        <LoadingState message="Checking your session..." />
      </AuthLayout>
    )
  }

  return (
    <Navigate to={status === 'authenticated' ? '/dashboard' : '/login'} replace />
  )
}
