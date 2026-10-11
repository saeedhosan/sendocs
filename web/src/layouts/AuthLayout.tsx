import { Fragment, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../components/navigation/Logo'
import styles from './AuthLayout.module.css'

export type AuthLayoutProps = {
  children: ReactNode
  /** A single muted link at the top right, e.g. "Help" or "Back to account". */
  headerAction?: { label: string; to: string }
  /** The sign-in reference uses the plain, unboxed logo. */
  boxedLogo?: boolean
  /** Page-specific footer copy/order when a reference differs. */
  footerVariant?: 'default' | 'reset-password'
  /** Each auth reference has a distinct mobile card alignment. */
  layoutVariant?: 'default' | 'login' | 'register' | 'forgot-password' | 'change-password' | 'reset-password'
}

const legalLinks = [
  { label: 'Terms', to: '/terms' },
  { label: 'Privacy', to: '/privacy' },
]

/**
 * The shared shell for every unauthenticated page: brand header, a centered
 * card, and the legal footer. It only lays out; pages own their content.
 */
export function AuthLayout({
  children,
  headerAction,
  boxedLogo = true,
  footerVariant = 'default',
  layoutVariant = 'default',
}: AuthLayoutProps) {
  const footerLinks =
    footerVariant === 'reset-password'
      ? [
          { label: 'Privacy', to: '/privacy' },
          { label: 'Terms', to: '/terms' },
        ]
      : legalLinks
  const copyright =
    footerVariant === 'reset-password'
      ? '© 2025 Sendocs Technologies Inc.'
      : '© 2025 Sendocs Inc.'

  return (
    <div className={styles.layout} data-layout-variant={layoutVariant}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Logo boxed={boxedLogo} />
          {headerAction ? (
            <Link to={headerAction.to} className={styles.headerAction}>
              {headerAction.label}
            </Link>
          ) : null}
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.card}>{children}</div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span>{copyright}</span>
          {footerVariant === 'reset-password' ? (
            <Fragment>
              <span className={styles.footerSeparator} aria-hidden="true">·</span>
              <span className={styles.footerLink}>Security</span>
            </Fragment>
          ) : null}
          {footerLinks.map((link) => (
            <Fragment key={link.to}>
              <span className={styles.footerSeparator} aria-hidden="true">·</span>
              <Link to={link.to} className={styles.footerLink}>
                {link.label}
              </Link>
            </Fragment>
          ))}
          {footerVariant !== 'reset-password' ? (
            <Fragment>
              <span className={styles.footerSeparator} aria-hidden="true">·</span>
              <span className={styles.footerLink}>Security</span>
            </Fragment>
          ) : null}
        </div>
      </footer>
    </div>
  )
}
