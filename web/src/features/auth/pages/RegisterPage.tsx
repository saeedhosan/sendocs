import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../app/providers/useAuth'
import { FormField } from '../../../components/forms/FormField'
import { Alert, Button, Input, PasswordInput } from '../../../components/ui'
import { AuthLayout } from '../../../layouts/AuthLayout'
import { errorMessage, validationErrors } from '../../../lib/api/errors'
import { passwordRequirements } from '../../../lib/password'
import { AuthDivider } from '../components/AuthDivider'
import { GoogleButton } from '../components/GoogleButton'
import { PasswordRequirementsList } from '../components/PasswordRequirementsList'
import { cn } from '../../../lib/cn'
import { fieldErrors, registerSchema } from '../schemas'
import { authStyles as s } from './authStyles'
import { app } from '../../../config/app'

type RegisterValues = {
  name: string
  email: string
  password: string
  confirmPassword: string
}

const emptyValues: RegisterValues = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
}

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [values, setValues] = useState<RegisterValues>(emptyValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const rules = passwordRequirements.map((requirement) => ({
    id: requirement.id,
    label: requirement.label,
    met: requirement.test(values.password),
  }))

  function update(field: keyof RegisterValues) {
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

    const parsed = registerSchema.safeParse(values)

    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error))
      return
    }

    setErrors({})
    setSubmitting(true)

    try {
      const { name, email, password } = parsed.data
      await register({ name, email, password })
      navigate('/dashboard', { replace: true })
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
    <AuthLayout>
      <div className={cn(s.heading, s.center)}>
        <h1 className={s.title}>Create your account</h1>
        <p className={s.subtitle}>
          Start collecting documents securely with {app.name}.
        </p>
      </div>

      <div className={s.social}>
        <GoogleButton label="Sign up with Google" />
      </div>

      <AuthDivider label="or register with email" compact />

      {formError ? (
        <Alert variant="error" className={s.formError}>
          {formError}
        </Alert>
      ) : null}

      <form className={s.form} onSubmit={handleSubmit} noValidate>
        <FormField label="Full name" error={errors.name}>
          <Input
            name="name"
            autoComplete="name"
            placeholder="Alex Morgan"
            value={values.name}
            onChange={update('name')}
          />
        </FormField>

        <FormField label="Work email address" error={errors.email}>
          <Input
            type="email"
            name="email"
            autoComplete="email"
            placeholder="alex@firm.com"
            value={values.email}
            onChange={update('email')}
          />
        </FormField>

        <FormField label="Password" error={errors.password}>
          <PasswordInput
            name="password"
            autoComplete="new-password"
            placeholder="••••••••••"
            value={values.password}
            onChange={update('password')}
          />
        </FormField>

        <FormField label="Confirm password" error={errors.confirmPassword}>
          <PasswordInput
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="••••••••••"
            value={values.confirmPassword}
            onChange={update('confirmPassword')}
          />
        </FormField>

        <PasswordRequirementsList rules={rules} />

        <div className="pt-2">
          <Button type="submit" fullWidth loading={submitting}>
            Create account
          </Button>
        </div>
      </form>

      <p className={s.legal}>
        By creating an account, you agree to our{' '}
        <Link to="/terms" className={s.legalLink}>
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link to="/privacy" className={s.legalLink}>
          Privacy Policy
        </Link>
        .
      </p>

      <div className={s.footerBox}>
        Already have an account?{' '}
        <Link to="/login" className={s.link}>
          Sign in
        </Link>
      </div>
    </AuthLayout>
  )
}
