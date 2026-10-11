import { LockIcon } from '../../../components/icons'
import { Logo } from '../../../components/navigation/Logo'
import { Container } from '../../../components/ui'
import styles from './PortalHeader.module.css'

/**
 * The portal's minimal shell: the brand mark and a privacy note. No account, no
 * navigation, no owner identity — the client is anonymous by design.
 */
export function PortalHeader() {
  return (
    <header className={styles.header}>
      <Container className={styles.inner}>
        <Logo to={null} />
        <span className={styles.private}>
          <LockIcon size={14} />
          <span>End-to-End Private</span>
        </span>
      </Container>
    </header>
  )
}
