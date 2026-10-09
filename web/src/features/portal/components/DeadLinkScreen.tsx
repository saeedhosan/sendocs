import { LinkOffIcon } from '../../../components/icons'
import styles from './DeadLinkScreen.module.css'

/**
 * The single dead-link screen.
 *
 * It is rendered without the portal shell and deliberately shows no request
 * title, item label, count, or link state: an unknown, malformed, expired,
 * revoked, or tampered link is indistinguishable from every other.
 */
export function DeadLinkScreen() {
  return (
    <main className={styles.wrap}>
      <div className={styles.card}>
        <span className={styles.icon}>
          <LinkOffIcon size={22} />
        </span>
        <h1 className={styles.title}>This link is no longer active</h1>
        <p className={styles.message}>
          The document upload link you accessed is invalid, expired, or has been
          revoked by the sender.
        </p>
        <p className={styles.note}>
          If you still need to submit documents, please contact the person or
          organization who requested them to request a new secure upload link.
        </p>
      </div>
    </main>
  )
}
