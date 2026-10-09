import { useState } from 'react'
import { Button } from '../../../components/ui'
import { GoogleIcon } from '../../../components/icons'
import { FormError } from '../../../components/forms/FormError'
import { authApi } from '../api'
import { errorMessage } from '../../../lib/api/errors'

export type GoogleButtonProps = {
  label: string
}

/**
 * Starts the documented Google OAuth flow.
 *
 * The authorization URL is fetched from the API and the browser is sent to
 * Google. The callback is API-owned; see the phase notes for its current
 * JSON-only response.
 */
export function GoogleButton({ label }: GoogleButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)

    try {
      const { authUrl } = await authApi.googleAuthUrl()
      window.location.assign(authUrl)
    } catch (cause) {
      setError(errorMessage(cause))
      setLoading(false)
    }
  }

  return (
    <div>
      <Button
        variant="secondary"
        fullWidth
        loading={loading}
        iconLeft={<GoogleIcon size={16} />}
        onClick={handleClick}
      >
        {label}
      </Button>
      {error ? <FormError>{error}</FormError> : null}
    </div>
  )
}
