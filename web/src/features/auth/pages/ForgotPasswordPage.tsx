import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FormField } from '../../../components/forms/FormField'
import { ArrowBackIcon, MailCheckIcon } from '../../../components/icons'
import { Alert, Button, Input } from '../../../components/ui'
import { AuthLayout } from '../../../layouts/AuthLayout'
import { errorMessage, validationErrors } from '../../../lib/api/errors'
import { authApi } from '../api'
import { fieldErrors, forgotPasswordSchema } from '../schemas'
import styles from './auth.module.css'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const parsed = forgotPasswordSchema.safeParse({ email })

    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error))
      return
    }

    setErrors({})
    setSubmitting(true)

    try {
      await authApi.forgotPassword(parsed.data.email)
      setSentTo(parsed.data.email)
    } catch (error) {
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

  if (sentTo !== null) {
    return (
      <AuthLayout layoutVariant="forgot-password">
        <div className={styles.successIcon} aria-hidden="true">
          <MailCheckIcon size={20} />
        </div>
        <div className={styles.heading}>
          <h1 className={styles.title}>Check your inbox</h1>
          <p className={styles.subtitle}>
            We sent a reset link to{' '}
            <span className={styles.strong}>{sentTo}</span>
          </p>
        </div>

        <div className={styles.infoBox}>
          <p className={styles.infoBoxTitle}>Link valid for 60 minutes</p>
          <p>
            Didn&apos;t receive an email? Check your spam folder or contact your
            administrator.
          </p>
        </div>

        <div className={styles.buttonStack}>
          <Button fullWidth onClick={() => navigate('/login')}>
            Return to sign in
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              setSentTo(null)
              setSubmitting(false)
            }}
          >
            Try another email
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout layoutVariant="forgot-password">
      <div className={styles.heading}>
        <h1 className={styles.title}>Forgot your password?</h1>
        <p className={styles.subtitle}>
          Enter your email address to receive a password reset link.
        </p>
      </div>

      {formError ? (
        <Alert variant="error" className={styles.formError}>
          {formError}
        </Alert>
      ) : null}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <FormField label="Email address" error={errors.email}>
          <Input
            type="email"
            name="email"
            autoComplete="email"
            placeholder="name@company.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setErrors({})
            }}
          />
        </FormField>

        <div className={styles.actions}>
          <Button type="submit" fullWidth loading={submitting}>
            Send reset link
          </Button>
        </div>
      </form>

      <div className={styles.backRow}>
        <Link to="/login" className={styles.backLink}>
          <ArrowBackIcon size={16} />
          Back to sign in
        </Link>
      </div>
    </AuthLayout>
  )
}
