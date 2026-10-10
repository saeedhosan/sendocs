import { DescriptionIcon, LockIcon } from '../../../components/icons'
import styles from './PortalHeader.module.css'

/**
 * The portal's minimal shell: a wordmark and a privacy note. No account, no
 * navigation, no owner identity — the client is anonymous by design.
 */
export function PortalHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <span className={styles.brand}>
          <DescriptionIcon size={16} className={styles.brandMark} />
          <span className={styles.wordmark}>Sendocs</span>
        </span>
        <span className={styles.private}>
          <LockIcon size={14} />
          <span>End-to-End Private</span>
        </span>
      </div>
    </header>
  )
}
