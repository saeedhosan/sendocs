import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../app/providers/useAuth'
import { FormField } from '../../../components/forms/FormField'
import { ArrowForwardIcon } from '../../../components/icons'
import { Alert, Button, Checkbox, Input, PasswordInput } from '../../../components/ui'
import { AuthLayout } from '../../../layouts/AuthLayout'
import { errorMessage, validationErrors } from '../../../lib/api/errors'
import { AuthDivider } from '../components/AuthDivider'
import { GoogleButton } from '../components/GoogleButton'
import { fieldErrors, loginSchema } from '../schemas'
import styles from './auth.module.css'

type LoginValues = {
  email: string
  password: string
  remember?: boolean
}

type LocationState = {
  from?: { pathname?: string }
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [values, setValues] = useState<LoginValues>({ email: '', password: '', remember: false })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const state = location.state as LocationState | null
  const redirectTo = state?.from?.pathname ?? '/dashboard'

  function update(field: keyof LoginValues) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      setValues((current) => ({ ...current, [field]: event.target.value }))
      setErrors((current) => {
        if (!(field in current)) {
          return current
        }

        const next = { ...current }
        delete next[field]
        return next
      })
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const parsed = loginSchema.safeParse(values)

    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error))
      return
    }

    setErrors({})
    setSubmitting(true)

    try {
      await login(parsed.data)
      navigate(redirectTo, { replace: true })
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

  return (
    <AuthLayout boxedLogo={false}>
      <div className={`${styles.heading} ${styles.center}`}>
        <h1 className={styles.title}>Sign in</h1>
        <p className={styles.subtitle}>Sign in to your account to continue.</p>
      </div>

      <div className={styles.social}>
        <GoogleButton label="Continue with Google" />
      </div>

      <AuthDivider label="or continue with email" />

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
            placeholder="alex@example.com"
            value={values.email}
            onChange={update('email')}
          />
        </FormField>

        <FormField
          label="Password"
          error={errors.password}
          labelAction={
            <Link to="/forgot-password" className={styles.link}>
              Forgot password?
            </Link>
          }
        >
          <PasswordInput
            name="password"
            autoComplete="current-password"
            placeholder="••••••••••••"
            value={values.password}
            onChange={update('password')}
          />
        </FormField>

        <Checkbox
          label="Remember this device for 30 days"
          name="remember"
          checked={values.remember ?? false}
          onChange={(event) => {
            setValues((current) => ({ ...current, remember: event.target.checked }))
          }}
        />

        <div className={styles.actions}>
          <Button
            type="submit"
            fullWidth
            loading={submitting}
            iconRight={<ArrowForwardIcon size={16} />}
          >
            Sign in
          </Button>
        </div>
      </form>

      <p className={styles.footerText}>
        Don&apos;t have an account?{' '}
        <Link to="/register" className={styles.link}>
          Create account
        </Link>
      </p>
    </AuthLayout>
  )
}
