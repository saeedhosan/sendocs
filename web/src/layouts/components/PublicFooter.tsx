import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import styles from './PublicFooter.module.css'

const links = [
  { label: 'Terms', to: '/terms' },
  { label: 'Privacy', to: '/privacy' },
]

/** The minimal public footer shared by the landing and legal pages. */
export function PublicFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <span>© 2026 Sendocs</span>
        {links.map((link) => (
          <Fragment key={link.to}>
            <span aria-hidden="true">·</span>
            <Link to={link.to} className={styles.link}>
              {link.label}
            </Link>
          </Fragment>
        ))}
      </div>
    </footer>
  )
}
