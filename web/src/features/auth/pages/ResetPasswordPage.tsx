import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../app/providers/useAuth'
import { FormField } from '../../../components/forms/FormField'
import { Alert, Button, PasswordInput } from '../../../components/ui'
import { AuthLayout } from '../../../layouts/AuthLayout'
import { ApiError } from '../../../lib/api/client'
import { errorMessage, validationErrors } from '../../../lib/api/errors'
import { authApi } from '../api'
import { PasswordStrengthMeter } from '../components/PasswordStrengthMeter'
import { fieldErrors, resetPasswordSchema } from '../schemas'
import { authStyles as s } from './authStyles'
import { app } from '../../../config/app'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setSession } = useAuth()

  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [invalidLink, setInvalidLink] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const parsed = resetPasswordSchema.safeParse({ password, confirmPassword })

    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error))
      return
    }

    setErrors({})
    setSubmitting(true)

    try {
      const payload = await authApi.resetPassword({
        token,
        password: parsed.data.password,
      })
      setSession(payload)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      if (error instanceof ApiError && error.code === 'invalid_token') {
        setInvalidLink(true)
        return
      }

      const fields = validationErrors(error)

      if (Object.keys(fields).length > 0) {
        setErrors(fields)
      } else {
        setFormError(errorMessage(error))
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (token === '' || invalidLink) {
    return (
      <AuthLayout headerAction={{ label: 'Help', to: '/contact' }}>
        <div className={s.heading}>
          <h1 className={s.title}>Reset link unavailable</h1>
          <p className={s.subtitle}>
            {invalidLink
              ? 'This link has expired or has already been used.'
              : 'This link is missing its reset token.'}
          </p>
        </div>
        <Alert variant="error" className={s.formError}>
          Request a new link to choose a password.
        </Alert>
        <Button fullWidth onClick={() => navigate('/forgot-password')}>
          Request a new link
        </Button>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout headerAction={{ label: 'Help', to: '/contact' }}>
      <div className={s.heading}>
        <h1 className={s.title}>Create a new password</h1>
        <p className={s.subtitle}>
          Choose a secure password for your {app.name} account.
        </p>
      </div>

      {formError ? (
        <Alert variant="error" className={s.formError}>
          {formError}
        </Alert>
      ) : null}

      <form className={s.formReset} onSubmit={handleSubmit} noValidate>
        <div>
          <FormField
            label="New password"
            error={errors.password}
            labelAction={
              <PasswordStrengthMeter value={password} variant="inline" />
            }
          >
            <PasswordInput
              name="password"
              autoComplete="new-password"
              visibilityButtonClassName="right-3 rounded-[10px]"
              placeholder="••••••••••••"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                setErrors({})
              }}
            />
          </FormField>
        </div>

        <FormField label="Confirm new password" error={errors.confirmPassword}>
          <PasswordInput
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="••••••••••••"
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value)
              setErrors({})
            }}
          />
        </FormField>

        <div className={s.actionsFlush}>
          <Button type="submit" fullWidth loading={submitting}>
            Reset password
          </Button>
        </div>
      </form>
    </AuthLayout>
  )
}
