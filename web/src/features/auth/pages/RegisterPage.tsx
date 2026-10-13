import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../app/providers/useAuth'
import { FormField } from '../../../components/forms/FormField'
import { PasswordInput } from "@/components/PasswordInput"
import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { AuthLayout } from '../../../layouts/AuthLayout'
import { errorMessage, validationErrors } from '../../../lib/api/errors'
import { passwordRequirements } from '../../../lib/password'
import { AuthDivider } from '../components/AuthDivider'
import { GoogleButton } from '../components/GoogleButton'
import { PasswordRequirementsList } from '../components/PasswordRequirementsList'
import { fieldErrors, registerSchema } from '../schemas'
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
      <div className="mb-6 text-center">
        <h1 className="mb-2 text-2xl leading-8 font-semibold tracking-[-0.025em] text-foreground">Create your account</h1>
        <p className="text-sm leading-5 text-muted-foreground">
          Start collecting documents securely with {app.name}.
        </p>
      </div>

      <div className="mb-6">
        <GoogleButton label="Sign up with Google" />
      </div>

      <AuthDivider label="or register with email" compact />

      {formError ? (
        <Alert variant="destructive" className="mb-4">
          {formError}
        </Alert>
      ) : null}

      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
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
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? <Spinner data-icon="inline-start" /> : null}
            Create account
          </Button>
        </div>
      </form>

      <p className="my-4 text-center text-xs leading-4 text-muted-foreground">
        By creating an account, you agree to our{' '}
        <Link to="/terms" className="text-primary underline-offset-4 hover:underline">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link to="/privacy" className="text-primary underline-offset-4 hover:underline">
          Privacy Policy
        </Link>
        .
      </p>

      <div className="mt-6 pt-5 border-t border-border text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="text-primary hover:text-primary/80 transition-colors">
          Sign in
        </Link>
      </div>
    </AuthLayout>
  )
}
