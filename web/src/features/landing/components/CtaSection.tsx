import { Link } from '../../../components/navigation/AppLink'
import styles from './CtaSection.module.css'

export function CtaSection() {
  return (
    <section className={styles.section}>
      <div className={styles.copy}>
        <h2 className={styles.heading}>Ready to simplify document collection?</h2>
        <p className={styles.body}>
          Create a request, share one link, and keep track of the documents you
          receive.
        </p>
      </div>
      <div className={styles.action}>
        <Link to="/register" className={styles.button}>
          Get started
        </Link>
      </div>
    </section>
  )
}
