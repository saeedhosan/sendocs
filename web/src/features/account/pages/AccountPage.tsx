import { useState } from 'react'
import type { FormEvent } from 'react'
import { NavLink } from 'react-router-dom'
import { LockKeyhole, UserRound, LayoutDashboard, Shield, Trash2 } from 'lucide-react'
import { useAuth } from '../../../app/providers/useAuth'
import { FormField } from '../../../components/forms/FormField'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { ApiError } from '../../../lib/api/client'
import { errorMessage, validationErrors } from '../../../lib/api/errors'
import { ProfileAvatar } from '../components/ProfileAvatar'

const navigationItem =
  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors'
const activeNavigationItem = 'bg-muted text-foreground font-medium'
const inactiveNavigationItem =
  'text-muted-foreground hover:bg-muted/70 hover:text-foreground'

export function AccountPage() {
  const { user, updateAccount } = useAuth()
  const [name, setName] = useState(user?.name ?? '')
  const [nameError, setNameError] = useState<string | undefined>()
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const hasChanges = name.trim() !== (user?.name ?? '')
  const canSave = hasChanges && name.trim().length > 0 && name.trim().length <= 120

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNameError(undefined)
    setFormError(null)
    setSuccess(false)

    const nextName = name.trim()

    if (!nextName) {
      setNameError('Enter your name.')
      return
    }

    if (nextName.length > 120) {
      setNameError('Your name must be 120 characters or fewer.')
      return
    }

    setSubmitting(true)

    try {
      await updateAccount({ name: nextName })
      setName(nextName)
      setSuccess(true)
    } catch (error) {
      const fields = validationErrors(error)

      if (fields.name) {
        setNameError(fields.name)
      } else if (error instanceof ApiError && error.status === 429) {
        setFormError('You have made too many changes. Please wait and try again.')
      } else {
        setFormError(errorMessage(error))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl pb-12">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your personal information.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[220px_minmax(0,1fr)]">
        <aside aria-label="Account settings navigation">
          <div className="space-y-5 rounded-xl border border-border bg-card p-3">
            <div>
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Account settings
              </p>
              <nav className="space-y-1">
                <NavLink
                  to="/account"
                  end
                  className={({ isActive }) =>
                    `${navigationItem} ${isActive ? activeNavigationItem : inactiveNavigationItem}`
                  }
                >
                  <UserRound className="size-4" aria-hidden="true" />
                  Account
                </NavLink>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `${navigationItem} ${isActive ? activeNavigationItem : inactiveNavigationItem}`
                  }
                >
                  <LayoutDashboard className="size-4" aria-hidden="true" />
                  Dashboard
                </NavLink>
              </nav>
            </div>

            <div className="border-t border-border pt-4">
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Security
              </p>
              <nav>
                <NavLink
                  to="/settings/password"
                  className={({ isActive }) =>
                    `${navigationItem} ${isActive ? activeNavigationItem : inactiveNavigationItem}`
                  }
                >
                  <Shield className="size-4" aria-hidden="true" />
                  Change password
                </NavLink>
              </nav>
            </div>

            <div className="border-t border-border pt-4">
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Danger zone
              </p>
              <nav>
                <NavLink
                  to="/settings/delete"
                  className={({ isActive }) =>
                    `${navigationItem} ${isActive ? 'bg-destructive/10 text-destructive font-medium' : 'text-destructive hover:bg-destructive/10'}`
                  }
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Delete account
                </NavLink>
              </nav>
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-5 py-4 sm:px-6">
              <h2 className="font-semibold text-foreground">Profile</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your name and profile picture are visible on your account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 px-5 py-6 sm:px-6" noValidate>
              <div className="flex items-center gap-4">
                <ProfileAvatar
                  name={user?.name ?? 'Account'}
                  pictureUrl={user?.pictureUrl}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">Profile picture</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Your Google profile picture, or an avatar generated from your name.
                  </p>
                </div>
              </div>

              {formError ? (
                <Alert variant="destructive" role="alert">{formError}</Alert>
              ) : null}
              {success ? (
                <Alert role="status">Your profile has been updated.</Alert>
              ) : null}

              <FormField label="Full name" error={nameError}>
                <Input
                  name="name"
                  autoComplete="name"
                  maxLength={120}
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value)
                    setNameError(undefined)
                    setFormError(null)
                    setSuccess(false)
                  }}
                />
              </FormField>

              <FormField
                label="Email address"
                labelAction={<LockKeyhole className="size-4 text-muted-foreground" aria-hidden="true" />}
                hint="Your email address is used for signing in and cannot be changed here."
              >
                <Input
                  type="email"
                  value={user?.email ?? ''}
                  disabled
                  aria-label="Email address"
                />
              </FormField>

              <div className="flex justify-end border-t border-border pt-5">
                <Button type="submit" disabled={!canSave || submitting}>
                  {submitting ? <Spinner data-icon="inline-start" /> : null}
                  {submitting ? 'Saving…' : 'Update profile'}
                </Button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  )
}
