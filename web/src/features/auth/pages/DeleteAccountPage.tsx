import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../app/providers/useAuth'
import { FormField } from '../../../components/forms/FormField'
import { AlertIcon, TrashIcon } from '../../../components/icons'
import { PasswordInput } from "@/components/PasswordInput"
import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { AuthLayout } from '../../../layouts/AuthLayout'
import { ApiError } from '../../../lib/api/client'
import { errorMessage, validationErrors } from '../../../lib/api/errors'
import { deleteAccountSchema, fieldErrors } from '../schemas'
import { authStyles as s } from './authStyles'
import { app } from '../../../config/app'

/**
 * Account deletion. The API requires the password and the address typed as
 * confirmation, so a replayed request cannot trigger it; both are collected
 * here before the irreversible DELETE.
 */
export function DeleteAccountPage() {
  const { user, deleteAccount } = useAuth()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const accountEmail = user?.email ?? ''

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const parsed = deleteAccountSchema(accountEmail).safeParse({
      password,
      confirm,
    })

    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error))
      return
    }

    setErrors({})
    setSubmitting(true)

    try {
      await deleteAccount({
        password: parsed.data.password,
        confirm: parsed.data.confirm,
      })
      navigate('/login', { replace: true })
    } catch (error) {
      if (error instanceof ApiError && error.code === 'invalid_credentials') {
        setErrors({ password: 'Password is incorrect.' })
      } else if (
        error instanceof ApiError &&
        error.code === 'password_not_supported'
      ) {
        setFormError('Accounts created with Google cannot be deleted here.')
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
      <div className={s.heading}>
        <h1 className={s.title}>Delete account</h1>
        <p className={s.subtitle}>
          Permanently close your {app.name} account.
        </p>
      </div>

      <div className={s.dangerBox}>
        <div className={s.dangerBoxTitle}>
          <AlertIcon size={16} aria-hidden="true" />
          This cannot be undone.
        </div>
        Deleting your account removes the account and everything it owns — every
        document request and uploaded file.
        <span className={s.dangerBoxNote}>
          Stored files are removed afterwards by a cleanup job.
        </span>
      </div>

      {formError ? (
        <Alert variant="destructive" className={s.formError}>
          {formError}
        </Alert>
      ) : null}

      <form className={s.form} onSubmit={handleSubmit} noValidate>
        <FormField label="Password" error={errors.password}>
          <PasswordInput
            name="password"
            autoComplete="current-password"
            placeholder="••••••••••••"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value)
              setErrors({})
            }}
          />
        </FormField>

        <FormField
          label="Confirm your email"
          error={errors.confirm}
          hint={
            <>
              Type <span className={s.strong}>{accountEmail}</span> to
              confirm.
            </>
          }
        >
          <Input
            type="email"
            name="confirm"
            autoComplete="off"
            placeholder={accountEmail}
            value={confirm}
            onChange={(event) => {
              setConfirm(event.target.value)
              setErrors({})
            }}
          />
        </FormField>

        <div className={s.actions}>
          <Button
            type="submit"
            variant="destructive"
            disabled={submitting}
            className="w-full"
          >
            {submitting ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <TrashIcon data-icon="inline-start" size={16} />
            )}
            Delete account
          </Button>
        </div>
      </form>

      <div className={s.cancelRow}>
        <Link to="/dashboard" className={s.link}>
          Cancel
        </Link>
      </div>
    </AuthLayout>
  )
}
