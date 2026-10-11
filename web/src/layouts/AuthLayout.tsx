import { Fragment, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../components/navigation/Logo'
import styles from './AuthLayout.module.css'

export type FooterVariant =
  | 'default'
  | 'login'
  | 'forget'
  | 'change'
  | 'reset-password'

export type AuthLayoutProps = {
  children: ReactNode
  /** A single muted link at the top right, e.g. "Help" or "Back to account". */
  headerAction?: { label: string; to: string }
  /** The sign-in reference uses the plain, unboxed logo. */
  boxedLogo?: boolean
  /** Page-specific footer copy/order/layout when a reference differs. */
  footerVariant?: FooterVariant
}

const legalLinks = [
  { label: 'Terms', to: '/terms' },
  { label: 'Privacy', to: '/privacy' },
  { label: 'Security', to: '/contact' },
]

const resetLinks = [
  { label: 'Security', to: '/contact' },
  { label: 'Privacy', to: '/privacy' },
  { label: 'Terms', to: '/terms' },
]

const whiteFooters: FooterVariant[] = ['login', 'forget', 'change']

/**
 * The shared shell for every unauthenticated page: brand header, a centered
 * card, and the legal footer. It only lays out; pages own their content.
 */
export function AuthLayout({
  children,
  headerAction,
  boxedLogo = true,
  footerVariant = 'default',
}: AuthLayoutProps) {
  const isReset = footerVariant === 'reset-password'
  const footerLinks = isReset ? resetLinks : legalLinks
  const copyright = isReset
    ? '© 2025 Sendocs Technologies Inc.'
    : '© 2025 Sendocs Inc.'
  const linkClass =
    footerVariant === 'login'
      ? `${styles.footerLink} ${styles.footerLinkSecondary}`
      : styles.footerLink

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

      <main className={styles.main}>
        <div className={styles.card}>{children}</div>
      </main>

      {isReset ? (
        <footer className={styles.footerReset}>
          <div className={styles.footerInnerReset}>
            <span className={styles.footerResetCopy}>{copyright}</span>
            <div className={styles.footerResetLinks}>
              {footerLinks.map((link, index) => (
                <Fragment key={link.to}>
                  {index > 0 ? (
                    <span aria-hidden="true" className={styles.footerResetDot}>
                      •
                    </span>
                  ) : null}
                  <Link to={link.to} className={styles.footerResetLink}>
                    {link.label}
                  </Link>
                </Fragment>
              ))}
            </div>
          </div>
        </footer>
      ) : (
        <footer
          className={`${styles.footer} ${
            whiteFooters.includes(footerVariant) ? styles.footerWhite : ''
          }`}
        >
          <div className={styles.footerInner}>
            <span>{copyright}</span>
            {footerLinks.map((link) => (
              <Fragment key={link.to}>
                <span aria-hidden="true">·</span>
                <Link to={link.to} className={linkClass}>
                  {link.label}
                </Link>
              </Fragment>
            ))}
          </div>
        </footer>
      )}
    </div>
  )
}