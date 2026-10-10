import { Outlet } from 'react-router-dom'
import { VerifyEmailBanner } from '../features/auth/components/VerifyEmailBanner'
import { OwnerHeader } from './components/OwnerHeader'
import styles from './OwnerLayout.module.css'

export function OwnerLayout() {
  return (
    <div className={styles.layout}>
      <OwnerHeader />
      <main className={styles.main}>
        <VerifyEmailBanner />
        <Outlet />
      </main>
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span>Sendocs</span>
          <span>Direct client document intake</span>
        </div>
      </footer>
    </div>
  )
}
