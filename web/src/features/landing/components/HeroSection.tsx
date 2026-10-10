import { Link } from 'react-router-dom'
import { ProductPreview } from './ProductPreview'
import styles from './HeroSection.module.css'

export function HeroSection() {
  return (
    <section className={styles.hero}>
      <div className={styles.copy}>
        <span className={styles.eyebrow}>
          <span className={styles.dot} aria-hidden="true" />
          Document collection, made simple
        </span>

        <div className={styles.headlineGroup}>
          <h1 className={styles.headline}>
            Collect client documents without the back-and-forth.
          </h1>
          <p className={styles.lede}>
            Create a document request, share one secure link, and track what your
            clients upload. Clients can submit documents without creating an
            account.
          </p>
        </div>

        <div className={styles.actions}>
          <Link to="/register" className={styles.primaryAction}>
            Get started
          </Link>
        </div>
      </div>

      <div className={styles.preview}>
        <ProductPreview />
      </div>
    </section>
  )
}
