import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../app/providers/useAuth'
import { CheckCircleIcon, MailIcon } from '../../../components/icons'
import { LoadingState } from '../../../components/feedback/LoadingState'
import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AuthLayout } from '../../../layouts/AuthLayout'
import { ApiError } from '../../../lib/api/client'
import { errorMessage } from '../../../lib/api/errors'
import { authApi } from '../api'

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
        <div
          className="inline-flex items-center justify-center size-10 mb-4 rounded-full bg-success-surface border border-success-border text-success"
          aria-hidden="true"
        >
          <CheckCircleIcon size={20} />
        </div>
        <div className="mb-6">
          <h1 className="mb-2 text-2xl leading-8 font-semibold tracking-[-0.025em] text-foreground">Email verified</h1>
          <p className="text-sm leading-5 text-muted-foreground">
            Your email address has been confirmed. Your account is ready.
          </p>
        </div>
        <Button
          className="w-full"
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
      <div
        className="inline-flex items-center justify-center size-10 mb-4 rounded-full bg-success-surface border border-success-border text-success"
        aria-hidden="true"
      >
        <MailIcon size={20} />
      </div>
      <div className="mb-6">
        <h1 className="mb-2 text-2xl leading-8 font-semibold tracking-[-0.025em] text-foreground">Verification failed</h1>
        <p className="text-sm leading-5 text-muted-foreground">{message}</p>
      </div>
      <Alert variant="destructive" className="mb-4">
        {status === 'authenticated'
          ? 'You can send a new verification email from your dashboard.'
          : 'Sign in to send a new verification email from your dashboard.'}
      </Alert>
      <div className="flex flex-col gap-2.5">
        <Button
          className="w-full"
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
