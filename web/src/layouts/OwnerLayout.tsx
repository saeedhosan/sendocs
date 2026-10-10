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
    </div>
  )
}
