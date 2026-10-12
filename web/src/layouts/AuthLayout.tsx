import { Fragment, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../components/navigation/Logo'
import { Container } from '../components/ui'
import { cn } from '../lib/cn'
import { app } from '../config/app'

const AUTH_CONTAINER =
  'px-6 min-[576px]:max-w-5xl min-[768px]:max-w-5xl min-[992px]:max-w-5xl min-[1200px]:max-w-5xl min-[1400px]:max-w-5xl'
const HEADER_INNER = `${AUTH_CONTAINER} flex items-center justify-between gap-4 min-h-16`
const MAIN =
  '[view-transition-name:page-content] flex flex-1 flex-col items-center justify-center w-full px-4'
const CARD =
  'w-full max-w-md mx-auto p-8 bg-surface border border-border rounded-[10px] shadow-sm [&_input:not([type=checkbox]):not([type=radio])]:rounded-[10px] [&_button:not(.absolute)]:rounded-[10px]'
const FOOTER_INNER =
  `${AUTH_CONTAINER} flex flex-wrap items-center justify-center gap-2 text-xs text-ink-muted text-center`
const FOOTER_RESET_INNER =
  `${AUTH_CONTAINER} flex flex-col items-center justify-center gap-4 text-[0.8125rem] leading-[1.125rem] text-ink-body text-center sm:flex-row`
const FOOTER_RESET_LINK = 'transition-colors duration-150 hover:text-ink'
const CHANGE_FOOTER_INNER = `${AUTH_CONTAINER} text-center text-xs text-ink-muted`
const EXTRA_LINK = 'transition-colors duration-150'

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
  /** Page-specific footer copy/order/layout when a reference differs. */
  footerVariant?: FooterVariant
  logoVariant?: 'auth' | 'auth-login' | 'auth-register'
  layoutVariant?: 'default' | 'login' | 'reset' | 'change'
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
  footerVariant = 'default',
  logoVariant = 'auth',
  layoutVariant = 'default',
}: AuthLayoutProps) {
  const isReset = footerVariant === 'reset-password'
  const isChange = footerVariant === 'change'
  const footerLinks = isReset ? resetLinks : legalLinks
  const copyright = isReset
    ? `© 2025 ${app.name} Technologies Inc.`
    : `© 2025 ${app.name} Inc.`
  const linkClass =
    footerVariant === 'login'
      ? `${EXTRA_LINK} hover:text-ink-secondary`
      : `${EXTRA_LINK} hover:text-ink-emphasis`

  return (
    <div className="flex flex-col min-h-screen bg-canvas-muted">
      <header className="w-full border-b border-border bg-surface">
        <Container className={HEADER_INNER}>
          <Logo variant={logoVariant} />
          {headerAction ? (
            <Link
              to={headerAction.to}
              className="text-sm font-medium text-ink-muted transition-colors duration-150 hover:text-ink"
            >
              {headerAction.label}
            </Link>
          ) : null}
        </Container>
      </header>

      <main className={cn(MAIN, layoutVariant === 'default' && 'py-6')}>
        <div
          className={cn(
            'flex flex-1 items-center justify-center w-full',
            layoutVariant === 'default' && 'px-4',
            layoutVariant === 'change' && 'max-w-md mt-0 mb-6 px-4 pt-6 sm:px-0',
          )}
        >
          <div
            className={cn(
              CARD,
              layoutVariant === 'default' || layoutVariant === 'reset'
                ? 'my-12'
                : layoutVariant === 'change'
                  ? 'my-0'
                  : 'mt-0 mb-12',
            )}
          >
            {children}
          </div>
        </div>
      </main>

      {isReset ? (
        <footer className="w-full py-6">
          <Container className={FOOTER_RESET_INNER}>
            <span>{copyright}</span>
            <div className="flex items-center gap-4">
              {footerLinks.map((link, index) => (
                <Fragment key={link.to}>
                  {index > 0 ? (
                    <span
                      aria-hidden="true"
                      className="transition-colors duration-150"
                    >
                      •
                    </span>
                  ) : null}
                  <Link to={link.to} className={FOOTER_RESET_LINK}>
                    {link.label}
                  </Link>
                </Fragment>
              ))}
            </div>
          </Container>
        </footer>
      ) : isChange ? (
        <footer className="w-full border-t border-border bg-surface py-6">
          <Container className={CHANGE_FOOTER_INNER}>
            <p>
              © 2025 {app.name} Inc. ·{' '}
              {footerLinks.map((link, index) => (
                <Fragment key={link.to}>
                  {index > 0 ? ' · ' : null}
                  <Link to={link.to} className={linkClass}>
                    {link.label}
                  </Link>
                </Fragment>
              ))}
            </p>
          </Container>
        </footer>
      ) : (
        <footer
          className={cn(
            'w-full border-t border-border py-6',
            whiteFooters.includes(footerVariant) && 'bg-surface',
            whiteFooters.includes(footerVariant) && '[&>div]:max-sm:flex-col',
          )}
        >
          <Container className={FOOTER_INNER}>
            <span>{copyright}</span>
            {footerLinks.map((link) => (
              <Fragment key={link.to}>
                <span
                  aria-hidden="true"
                  className={whiteFooters.includes(footerVariant) ? 'max-sm:hidden' : undefined}
                >
                  ·
                </span>
                <Link to={link.to} className={linkClass}>
                  {link.label}
                </Link>
              </Fragment>
            ))}
          </Container>
        </footer>
      )}
    </div>
  )
}
