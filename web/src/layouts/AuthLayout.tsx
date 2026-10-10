import { Fragment, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../components/navigation/Logo'
import { cn } from '../lib/cn'
import styles from './AuthLayout.module.css'

export type AuthLayoutProps = {
  children: ReactNode
  /** A single muted link at the top right, e.g. "Help" or "Back to account". */
  headerAction?: { label: string; to: string }
  /** The sign-in reference uses the plain, unboxed logo. */
  boxedLogo?: boolean
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
}: AuthLayoutProps) {
  return (
    <div className={styles.layout}>
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

      <main className={cn(styles.main, insetCard && styles.insetMain)}>
        <div className={styles.card}>{children}</div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span>© 2025 Sendocs Inc.</span>
          {legalLinks.map((link) => (
            <Fragment key={link.to}>
              <span aria-hidden="true">·</span>
              <Link to={link.to} className={styles.footerLink}>
                {link.label}
              </Link>
            </Fragment>
          ))}
        </div>
      </footer>
    </div>
  )
}
