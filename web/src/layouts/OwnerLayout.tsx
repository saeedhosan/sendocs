import { Link, Outlet, useLocation } from 'react-router-dom'
import { Container } from '../components/ui'
import { VerifyEmailBanner } from '../features/auth/components/VerifyEmailBanner'
import { OwnerHeader } from './components/OwnerHeader'
import styles from './OwnerLayout.module.css'

export function OwnerLayout() {
  const pathname = useLocation().pathname
  const showFooter = pathname !== '/dashboard'
  const isRequestDetail = /^\/requests\/[^/]+$/.test(pathname)

  return (
    <div className={styles.layout}>
      <OwnerHeader />
      <main className={styles.main}>
        <Container>
          <VerifyEmailBanner />
        </Container>
        <Outlet />
      </main>
      {showFooter ? (
        <footer className={styles.footer}>
          <Container className={styles.footerInner}>
            <span>Sendocs</span>
            {isRequestDetail ? (
              <div className={styles.footerLinks}>
                <Link to="/contact">Help</Link>
                <Link to="/privacy">Privacy</Link>
              </div>
            ) : (
              <span>Direct client document intake</span>
            )}
          </Container>
        </footer>
      ) : null}
    </div>
  )
}
