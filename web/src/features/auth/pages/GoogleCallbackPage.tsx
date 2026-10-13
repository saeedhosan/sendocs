import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../app/providers/useAuth'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { LoadingState } from '../../../components/feedback/LoadingState'
import { AuthLayout } from '../../../layouts/AuthLayout'
import { errorMessage } from '../../../lib/api/errors'
import { authApi } from '../api'

type CallbackState = 'loading' | 'error'

export function GoogleCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setSession } = useAuth()
  const started = useRef(false)
  const [state, setState] = useState<CallbackState>('loading')
  const [message, setMessage] = useState('')

  const code = searchParams.get('code')
  const oauthState = searchParams.get('state')
  const providerError = searchParams.get('error')

  useEffect(() => {
    if (started.current) {
      return
    }

    started.current = true

    if (providerError) {
      setState('error')
      setMessage(
        providerError === 'access_denied'
          ? 'Google sign-in was cancelled. You can try again when you are ready.'
          : 'Google could not complete sign-in. Please try again.',
      )
      return
    }

    if (!code || !oauthState) {
      setState('error')
      setMessage('This Google sign-in link is incomplete or has expired. Please try again.')
      return
    }

    const controller = new AbortController()

    authApi
      .googleCallback(code, oauthState, controller.signal)
      .then((payload) => {
        setSession(payload)
        navigate('/dashboard', { replace: true })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return
        }

        setState('error')
        setMessage(errorMessage(error))
      })

    return () => {
      controller.abort()
    }
  }, [code, navigate, oauthState, providerError, setSession])

  if (state === 'loading') {
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
