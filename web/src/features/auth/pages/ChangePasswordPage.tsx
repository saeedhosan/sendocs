import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../app/providers/useAuth'
import { FormField } from '../../../components/forms/FormField'
import { FormError } from '../../../components/forms/FormError'
import { ArrowForwardIcon, CheckCircleIcon, InfoIcon } from '../../../components/icons'
import { Alert, Button, Input, PasswordInput } from '../../../components/ui'
import { AuthLayout } from '../../../layouts/AuthLayout'
import { ApiError } from '../../../lib/api/client'
import { errorMessage, validationErrors } from '../../../lib/api/errors'
import { passwordRequirements } from '../../../lib/password'
import { PasswordRequirementsList } from '../components/PasswordRequirementsList'
import { PasswordStrengthMeter } from '../components/PasswordStrengthMeter'
import { changePasswordSchema, fieldErrors } from '../schemas'
import styles from './auth.module.css'

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
    ...passwordRequirements.map((requirement) => ({
      id: requirement.id,
      label: requirement.label,
      met: requirement.test(password),
    })),
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
    <AuthLayout
      headerAction={{ label: 'Back to account', to: '/dashboard' }}
      insetCard
    >
      <div className={styles.heading}>
        <h1 className={styles.title}>Change password</h1>
        <p className={styles.subtitle}>
          Update the password used to sign in to your Sendocs account.
        </p>
      </div>

      <div className={styles.changeInfoBox}>
        <InfoIcon
          size={18}
          aria-hidden="true"
          className={styles.changeInfoIcon}
        />
        <div className={styles.changeInfoBoxText}>
          <p>
            Updating your password will automatically terminate all active
            sessions on other devices.
          </p>
          <span className={styles.infoBoxNote}>
            SOC2 compliant session termination
          </span>
        </div>
      </div>

      {success ? (
        <Alert variant="success" className={styles.formError}>
          Password updated. Other sessions have been signed out.
        </Alert>
      ) : null}

      {formError ? (
        <Alert variant="error" className={styles.formError}>
          {formError}
        </Alert>
      ) : null}

      <form
        className={`${styles.form} ${styles.changePasswordForm}`}
        onSubmit={handleSubmit}
        noValidate
      >
        <FormField
          label="Current password"
          error={errors.currentPassword}
          labelAction={
            <Link to="/forgot-password" className={styles.link}>
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
            <div className={styles.confirmPasswordInput}>
              <Input
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                className={styles.confirmPasswordField}
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
                  className={styles.confirmPasswordCheck}
                />
              ) : null}
            </div>
          </FormField>
          {passwordsMismatch ? (
            <FormError>Passwords do not match</FormError>
          ) : null}
        </div>

        <PasswordRequirementsList rules={rules} panel title="Requirements" />

        <div className={styles.actions}>
          <Button
            type="submit"
            fullWidth
            loading={submitting}
            iconRight={<ArrowForwardIcon size={18} />}
          >
            Save new password
          </Button>
          <div className={styles.cancelRow}>
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              Cancel
            </Button>
          </div>
        </div>
      </form>
    </AuthLayout>
  )
}
