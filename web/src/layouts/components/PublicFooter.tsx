import { Fragment } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '../../lib/cn'
import styles from './PublicFooter.module.css'

const links = [
  { label: 'Terms', to: '/terms' },
  { label: 'Privacy', to: '/privacy' },
  { label: 'Contact', to: '/contact' },
]

const landingLinks = [
  { label: 'Terms', to: '/terms' },
  { label: 'Privacy', to: '/privacy' },
]

/** The minimal public footer shared by the landing and legal pages. */
export function PublicFooter() {
  const isLanding = useLocation().pathname === '/'
  const visibleLinks = isLanding ? landingLinks : links

  return (
    <footer className={cn(styles.footer, isLanding && styles.landingFooter)}>
      <div className={cn(styles.inner, isLanding && styles.landingInner)}>
        <span>{isLanding ? '© 2026 Sendocs' : '© 2025 Sendocs Inc.'}</span>
        {visibleLinks.map((link) => (
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
