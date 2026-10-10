import { Link, Outlet, useLocation } from 'react-router-dom'
import { VerifyEmailBanner } from '../features/auth/components/VerifyEmailBanner'
import { OwnerHeader } from './components/OwnerHeader'
import styles from './OwnerLayout.module.css'

export function OwnerLayout() {
  const pathname = useLocation().pathname
  const showFooter = pathname !== '/dashboard'
  const isRequestDetail = /^\/requests\/[^/]+$/.test(pathname)
  const isNewRequest = pathname === '/requests/new'

  return (
    <div className={styles.layout}>
      <OwnerHeader />
      <main className={styles.main}>
        <VerifyEmailBanner />
        <Outlet />
      </main>
      {showFooter ? (
        <footer className={styles.footer}>
          <div
            className={[
              styles.footerInner,
              isRequestDetail && styles.footerDetail,
              isNewRequest && styles.footerNewRequest,
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <span>Sendocs</span>
            {isRequestDetail ? (
              <div className={styles.footerLinks}>
                <Link to="/contact">Help</Link>
                <Link to="/privacy">Privacy</Link>
              </div>
            ) : (
              <span>Direct client document intake</span>
            )}
          </div>
        </footer>
      ) : null}
    </div>
  )
}
