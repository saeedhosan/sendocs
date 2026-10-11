import { Fragment, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../components/navigation/Logo'
import { Container } from '../components/ui'
import { cn } from '../lib/cn'
import { app } from '../config/app'

const HEADER_INNER = 'flex items-center justify-between gap-4 min-h-16'
const MAIN =
  '[view-transition-name:page-content] flex flex-1 items-center justify-center py-12'
const CARD =
  'w-full max-w-md my-12 p-8 bg-surface border border-border rounded-[10px] shadow-sm [&_input]:rounded-[10px] [&_button:not(.absolute)]:rounded-[10px]'
const FOOTER_INNER =
  'flex flex-wrap items-center justify-center gap-2 text-xs text-ink-muted text-center max-sm:flex-col'
const FOOTER_RESET_INNER =
  'flex flex-col items-center justify-center gap-4 text-[0.8125rem] leading-[1.125rem] text-ink-body text-center sm:flex-row'
const FOOTER_RESET_LINK = 'transition-colors duration-150 hover:text-ink'
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
}: AuthLayoutProps) {
  const isReset = footerVariant === 'reset-password'
  const footerLinks = isReset ? resetLinks : legalLinks
  const copyright = isReset
    ? `© 2025 ${app.name} Technologies Inc.`
    : `© 2025 ${app.name} Inc.`
  const linkClass =
    footerVariant === 'login'
      ? `${EXTRA_LINK} hover:text-ink-secondary`
      : `${EXTRA_LINK} hover:text-ink-emphasis`

  return (
    <div className="flex flex-col min-h-screen">
      <header className="w-full border-b border-border bg-surface">
        <Container className={HEADER_INNER}>
          <Logo variant="auth" />
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

      <Container as="main" className={MAIN}>
        <div className={CARD}>{children}</div>
      </Container>

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
      ) : (
        <footer
          className={cn(
            'w-full border-t border-border bg-surface py-6',
            whiteFooters.includes(footerVariant) && 'bg-surface',
          )}
        >
          <Container className={FOOTER_INNER}>
            <span>{copyright}</span>
            {footerLinks.map((link) => (
              <Fragment key={link.to}>
                <span aria-hidden="true">·</span>
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