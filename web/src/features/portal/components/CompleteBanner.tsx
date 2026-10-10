import { CheckCircleIcon } from '../../../components/icons'
import styles from './CompleteBanner.module.css'

export type CompleteBannerProps = {
  uploaded: number
  total: number
}

/** Shown once every item is uploaded; there is nothing left to do. */
export function CompleteBanner({ uploaded, total }: CompleteBannerProps) {
  return (
    <section className={styles.banner} aria-labelledby="portal-complete-title">
      <span className={styles.icon}>
        <CheckCircleIcon size={22} />
      </span>
      <h2 id="portal-complete-title" className={styles.title}>
        All documents received
      </h2>
      <p className={styles.message}>
        You have uploaded all {total} requested documents. The request owner has
        been notified and can now review your files.
      </p>
      <span className={styles.chip}>
        {uploaded} of {total} uploaded · Complete
      </span>
    </section>
  )
}
