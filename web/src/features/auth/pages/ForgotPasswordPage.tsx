import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FormField } from '../../../components/forms/FormField'
import { ArrowBackIcon, MailIcon } from '../../../components/icons'
import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { AuthLayout } from '../../../layouts/AuthLayout'
import { errorMessage, validationErrors } from '../../../lib/api/errors'
import { authApi } from '../api'
import { fieldErrors, forgotPasswordSchema } from '../schemas'

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
      <AuthLayout>
        <div
          className="inline-flex items-center justify-center size-10 mb-4 rounded-full bg-success-surface border border-success-border text-success"
          aria-hidden="true"
        >
          <MailIcon size={20} />
        </div>
        <div className="mb-6">
          <h1 className="mb-2 text-2xl leading-8 font-semibold tracking-[-0.025em] text-foreground">Check your inbox</h1>
          <p className="text-sm leading-5 text-muted-foreground">
            We sent a reset link to{' '}
            <span className="font-medium text-foreground">{sentTo}</span>
          </p>
        </div>

        <div className="mb-6 p-4 bg-muted border border-border rounded-lg text-xs leading-[1.375rem] text-muted-foreground">
          <p className="flex items-start gap-1.5 mb-1 font-medium text-muted-foreground">Link valid for 60 minutes</p>
          <p>
            Didn&apos;t receive an email? Check your spam folder or contact your
            administrator.
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          <Button className="w-full" onClick={() => navigate('/login')}>
            Return to sign in
          </Button>
          <Button
            variant="secondary"
            className="w-full"
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
    <AuthLayout>
      <div className="mb-6">
        <h1 className="mb-2 text-2xl leading-8 font-semibold tracking-[-0.025em] text-foreground">Forgot your password?</h1>
        <p className="text-sm leading-5 text-muted-foreground">
          Enter your email address to receive a password reset link.
        </p>
      </div>

      {formError ? (
        <Alert variant="destructive" className="mb-4 rounded-lg">
          {formError}
        </Alert>
      ) : null}

      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
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

        <div className="mt-2">
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? <Spinner data-icon="inline-start" /> : null}
            Send reset link
          </Button>
        </div>
      </form>

      <div className="mt-6 flex h-[25px] items-center justify-center text-sm text-muted-foreground">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ArrowBackIcon size={16} />
          Back to sign in
        </Link>
      </div>
    </AuthLayout>
  )
}
