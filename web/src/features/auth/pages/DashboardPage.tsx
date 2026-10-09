import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../app/providers/useAuth'
import { Logo } from '../../../components/navigation/Logo'
import { Alert, Button } from '../../../components/ui'
import { authApi } from '../api'
import styles from './DashboardPage.module.css'

export function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [resending, setResending] = useState(false)
  const [resendSent, setResendSent] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)

  const verified = user?.emailVerifiedAt != null

  async function handleResend() {
    setResending(true)
    setResendSent(false)
    setResendError(null)

    try {
      await authApi.resendVerification()
      setResendSent(true)
    } catch {
      setResendError('We could not send the email. Please try again shortly.')
    } finally {
      setResending(false)
    }
  }

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Logo />
        <div className={styles.headerMeta}>
          <span className={styles.email}>{user?.email}</span>
          <Button variant="secondary" size="sm" onClick={handleLogout}>
            Sign out
          </Button>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.card}>
          <h1 className={styles.title}>Your account</h1>
          <p className={styles.subtitle}>
            Manage your Sendocs profile and account security.
          </p>

          {!verified ? (
            <div className={styles.banner}>
              <Alert variant="warning">
                Verify your email address to unlock document workflows.
              </Alert>
              {resendSent ? (
                <Alert variant="success">
                  Verification email sent. Check your inbox.
                </Alert>
              ) : null}
              {resendError ? <Alert variant="error">{resendError}</Alert> : null}
              <Button
                variant="secondary"
                fullWidth
                loading={resending}
                onClick={handleResend}
              >
                Resend verification email
              </Button>
            </div>
          ) : null}

          <dl className={styles.details}>
            <div className={styles.row}>
              <dt className={styles.rowLabel}>Name</dt>
              <dd className={styles.rowValue}>{user?.name}</dd>
            </div>
            <div className={styles.row}>
              <dt className={styles.rowLabel}>Email</dt>
              <dd className={styles.rowValue}>{user?.email}</dd>
            </div>
            <div className={styles.row}>
              <dt className={styles.rowLabel}>Email status</dt>
              <dd
                className={`${styles.badge} ${
                  verified ? styles.badgeVerified : styles.badgeUnverified
                }`}
              >
                {verified ? 'Verified' : 'Unverified'}
              </dd>
            </div>
          </dl>

          <div className={styles.actions}>
            <Button onClick={() => navigate('/settings/password')}>
              Change password
            </Button>
          </div>
        </section>
      </main>
    </div>
  )
}
