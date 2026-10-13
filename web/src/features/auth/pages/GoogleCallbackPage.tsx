import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../app/providers/useAuth'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { LoadingState } from '../../../components/feedback/LoadingState'
import { AuthLayout } from '../../../layouts/AuthLayout'
import { errorMessage } from '../../../lib/api/errors'
import { authApi } from '../api'

export function GoogleCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setSession } = useAuth()
  const started = useRef(false)
  const [requestError, setRequestError] = useState<string | null>(null)

  const code = searchParams.get('code')
  const oauthState = searchParams.get('state')
  const providerError = searchParams.get('error')
  const callbackMessage = providerError
    ? providerError === 'access_denied'
      ? 'Google sign-in was cancelled. You can try again when you are ready.'
      : 'Google could not complete sign-in. Please try again.'
    : !code || !oauthState
      ? 'This Google sign-in link is incomplete or has expired. Please try again.'
      : null
  const message = callbackMessage ?? requestError
  const hasError = message !== null

  useEffect(() => {
    if (started.current || providerError || !code || !oauthState) {
      return
    }

    started.current = true

    authApi
      .googleCallback(code, oauthState)
      .then((payload) => {
        setSession(payload)
        navigate('/dashboard', { replace: true })
      })
      .catch((error: unknown) => {
        setRequestError(errorMessage(error))
      })
  }, [code, navigate, oauthState, providerError, setSession])

  if (!hasError) {
    return (
      <AuthLayout>
        <LoadingState
          title="Signing you in"
          message="Finishing your Google sign-in. This should only take a moment."
        />
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="mb-6">
        <h1 className="mb-2 text-2xl leading-8 font-semibold tracking-[-0.025em] text-foreground">
          Google sign-in failed
        </h1>
        <p className="text-sm leading-5 text-muted-foreground">
          We couldn&apos;t sign you in with Google.
        </p>
      </div>

      <Alert variant="destructive" className="mb-4">
        {message}
      </Alert>

      <Button className="w-full" onClick={() => navigate('/login', { replace: true })}>
        Back to sign in
      </Button>
    </AuthLayout>
  )
}
