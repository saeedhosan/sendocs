import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../app/providers/useAuth'
import { FormField } from '../../../components/forms/FormField'
import { FormError } from '../../../components/forms/FormError'
import { ArrowForwardIcon, CheckCircleIcon, InfoIcon } from '../../../components/icons'
import { PasswordInput } from "@/components/PasswordInput"
import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { AuthLayout } from '../../../layouts/AuthLayout'
import { ApiError } from '../../../lib/api/client'
import { errorMessage, validationErrors } from '../../../lib/api/errors'
import { PasswordRequirementsList } from '../components/PasswordRequirementsList'
import { PasswordStrengthMeter } from '../components/PasswordStrengthMeter'
import { changePasswordSchema, fieldErrors } from '../schemas'
import { app } from '../../../config/app'

export function ChangePasswordPage() {
  const { changePassword } = useAuth()
  const navigate = useNavigate()

  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const passwordsMatch = confirmPassword !== '' && password === confirmPassword
  const passwordsMismatch = confirmPassword !== '' && password !== confirmPassword

  const rules = [
    {
      id: 'length',
      label: 'Minimum 6 characters',
      met: password.length >= 6,
    },
    {
      id: 'different',
      label: 'Different from current',
      met: password !== '' && password !== currentPassword,
    },
  ]

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setSuccess(false)

    const parsed = changePasswordSchema.safeParse({
      currentPassword,
      password,
      confirmPassword,
    })

    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error))
      return
    }

    setErrors({})
    setSubmitting(true)

    try {
      await changePassword({
        currentPassword: parsed.data.currentPassword,
        password: parsed.data.password,
      })
      setSuccess(true)
      setCurrentPassword('')
      setPassword('')
      setConfirmPassword('')
    } catch (error) {
      if (error instanceof ApiError && error.code === 'invalid_credentials') {
        setErrors({ currentPassword: 'Current password is incorrect.' })
      } else {
        const fields = validationErrors(error)

        if (Object.keys(fields).length > 0) {
          setErrors(fields)
        } else {
          setFormError(errorMessage(error))
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout headerAction={{ label: 'Back to account', to: '/dashboard' }}>
      <div className="mb-6">
        <h1 className="mb-2 text-2xl leading-8 font-semibold tracking-[-0.025em] text-foreground">Change password</h1>
        <p className="text-sm leading-5 text-muted-foreground">
          Update the password used to sign in to your {app.name} account.
        </p>
      </div>

      <div className="flex items-start gap-2.5 mb-5 p-3 bg-muted border border-border rounded-lg text-xs leading-[1.125rem] text-muted-foreground">
        <InfoIcon
          size={18}
          aria-hidden="true"
          className="shrink-0 mt-0.5 text-primary"
        />
        <div className="flex-1 leading-relaxed">
          <p>
            Updating your password will automatically terminate all active
            sessions on other devices.
          </p>
          <span className="block mt-0.5 font-mono text-[0.6875rem] text-muted-foreground">
            SOC2 compliant session termination
          </span>
        </div>
      </div>

      {success ? (
        <Alert>
          Password updated. All sessions have been terminated.
        </Alert>
      ) : null}

      {formError ? (
        <Alert variant="destructive" className="mb-4">
          {formError}
        </Alert>
      ) : null}

      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <FormField
          label="Current password"
          error={errors.currentPassword}
          labelAction={
            <Link
              to="/forgot-password"
              className="text-primary hover:text-primary/80 transition-colors text-xs"
            >
              Forgot password?
            </Link>
          }
        >
          <PasswordInput
            name="currentPassword"
            autoComplete="current-password"
            placeholder="••••••••••••"
            value={currentPassword}
            onChange={(event) => {
              setCurrentPassword(event.target.value)
              setErrors({})
            }}
          />
        </FormField>

        <div>
          <FormField label="New password" error={errors.password}>
            <PasswordInput
              name="newPassword"
              autoComplete="new-password"
              placeholder="Enter new secure password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                setErrors({})
                setSuccess(false)
              }}
            />
          </FormField>
          <PasswordStrengthMeter value={password} />
        </div>

        <div>
          <FormField label="Confirm new password" error={errors.confirmPassword}>
            <div className="relative">
              <Input
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                className="pr-10"
                onChange={(event) => {
                  setConfirmPassword(event.target.value)
                  setErrors({})
                  setSuccess(false)
                }}
              />
              {passwordsMatch ? (
                <CheckCircleIcon
                  size={18}
                  aria-hidden="true"
                  className="absolute right-2.5 text-success pointer-events-none"
                />
              ) : null}
            </div>
          </FormField>
          {passwordsMismatch ? (
            <FormError>Passwords do not match</FormError>
          ) : null}
        </div>

        <PasswordRequirementsList rules={rules} panel title="Requirements" />

        <div className="mt-0 pt-2">
          <Button
            type="submit"
            disabled={submitting}
            className="w-full"
          >
            {submitting ? <Spinner data-icon="inline-start" /> : null}
            Save new password
            <ArrowForwardIcon data-icon="inline-end" size={18} />
          </Button>
          <div className="mt-3 text-center min-h-6">
            <button
              type="button"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </AuthLayout>
  )
}
