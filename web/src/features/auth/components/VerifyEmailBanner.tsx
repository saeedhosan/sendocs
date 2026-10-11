import { useState } from 'react'
import { useAuth } from '../../../app/providers/useAuth'
import { Alert, Button } from '../../../components/ui'
import { errorMessage } from '../../../lib/api/errors'
import { authApi } from '../api'

/**
 * Non-blocking reminder for owners whose address is not yet confirmed.
 * Verification gates nothing, so this only offers the documented resend
 * action and never blocks the owner area.
 */
export function VerifyEmailBanner() {
  const { user } = useAuth()

  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (user === null || user.emailVerifiedAt !== null) {
    return null
  }

  async function handleResend() {
    setSending(true)
    setError(null)

    try {
      await authApi.resendVerification()
      setSent(true)
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setSending(false)
    }
  }

  return (
    <Alert
      variant="warning"
      title="Verify your email address"
      className="mb-4"
    >
      <p>
        {sent
          ? `Verification email sent to ${user.email}. Check your inbox.`
          : `We sent a verification link to ${user.email}.`}
      </p>
      {error ? <p className="mt-1">{error}</p> : null}
      {sent ? null : (
        <Button
          variant="secondary"
          size="sm"
          loading={sending}
          onClick={handleResend}
          className="mt-2"
        >
          Resend email
        </Button>
      )}
    </Alert>
  )
}
