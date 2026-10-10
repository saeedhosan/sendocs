import { Outlet } from 'react-router-dom'
import { PublicFooter } from './components/PublicFooter'
import { PublicHeader } from './components/PublicHeader'
import styles from './PublicLayout.module.css'

/**
 * The shell for every public page: marketing header, content, and footer.
 * It only lays out; pages own their content.
 */
export function PublicLayout() {
  return (
    <div className={styles.layout}>
      <PublicHeader />
      <main className={styles.main}>
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  )
}
