import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../app/providers/useAuth'
import { CheckCircleIcon, MailIcon } from '../../../components/icons'
import { LoadingState } from '../../../components/feedback/LoadingState'
import { Alert, Button } from '../../../components/ui'
import { AuthLayout } from '../../../layouts/AuthLayout'
import { ApiError } from '../../../lib/api/client'
import { errorMessage } from '../../../lib/api/errors'
import { authApi } from '../api'
import styles from './auth.module.css'

type VerifyState = 'loading' | 'success' | 'error'

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { status } = useAuth()

  const token = searchParams.get('token') ?? ''

  const [state, setState] = useState<VerifyState>(token === '' ? 'error' : 'loading')
  const [message, setMessage] = useState(
    token === '' ? 'This verification link is missing its token.' : '',
  )

  useEffect(() => {
    if (token === '') {
      return
    }

    const controller = new AbortController()

    authApi
      .verifyEmail(token, controller.signal)
      .then(() => {
        setState('success')
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return
        }

        setState('error')
        setMessage(
          error instanceof ApiError && error.code === 'invalid_token'
            ? 'This verification link has expired or has already been used.'
            : errorMessage(error),
        )
      })

    return () => {
      controller.abort()
    }
  }, [token])

  if (state === 'loading') {
    return (
      <AuthLayout>
        <LoadingState message="Verifying your email address..." />
      </AuthLayout>
    )
  }

  if (state === 'success') {
    return (
      <AuthLayout>
        <div className={styles.successIcon} aria-hidden="true">
          <CheckCircleIcon size={20} />
        </div>
        <div className={styles.heading}>
          <h1 className={styles.title}>Email verified</h1>
          <p className={styles.subtitle}>
            Your email address has been confirmed. Your account is ready.
          </p>
        </div>
        <Button
          fullWidth
          onClick={() =>
            navigate(status === 'authenticated' ? '/dashboard' : '/login')
          }
        >
          {status === 'authenticated' ? 'Go to dashboard' : 'Continue to sign in'}
        </Button>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className={styles.successIcon} aria-hidden="true">
        <MailIcon size={20} />
      </div>
      <div className={styles.heading}>
        <h1 className={styles.title}>Verification failed</h1>
        <p className={styles.subtitle}>{message}</p>
      </div>
      <Alert variant="error" className={styles.formError}>
        You can request a new verification email from your account settings.
      </Alert>
      <div className={styles.buttonStack}>
        <Button
          fullWidth
          onClick={() =>
            navigate(status === 'authenticated' ? '/dashboard' : '/login')
          }
        >
          {status === 'authenticated' ? 'Go to dashboard' : 'Continue to sign in'}
        </Button>
      </div>
    </AuthLayout>
  )
}
