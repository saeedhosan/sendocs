import { Link, Outlet, useLocation } from 'react-router-dom'
import { VerifyEmailBanner } from '../features/auth/components/VerifyEmailBanner'
import { OwnerHeader } from './components/OwnerHeader'
import styles from './OwnerLayout.module.css'
import themeStyles from '../styles/owner-themes.module.css'

export function OwnerLayout() {
  const pathname = useLocation().pathname
  const showFooter = pathname !== '/dashboard'
  const isNewRequest = pathname === '/requests/new'
  const isRequestDetail = !isNewRequest && /^\/requests\/[^/]+$/.test(pathname)
  const themeClass =
    pathname === '/dashboard'
      ? themeStyles.dashboardTheme
      : isNewRequest
        ? themeStyles.newRequestTheme
        : isRequestDetail
          ? themeStyles.requestDetailTheme
          : undefined
  const layoutClassName = [styles.layout, themeClass].filter(Boolean).join(' ')

  return (
    <div className={layoutClassName}>
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
