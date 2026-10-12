import { Fragment } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Container } from '../../components/ui'
import { cn } from '../../lib/cn'
import { app } from '../../config/app'

const INNER =
  'flex flex-wrap items-center justify-center gap-2 text-ink-muted text-center'
const INNER_DEFAULT = 'text-xs leading-4'
const INNER_LANDING = 'min-h-14 text-[0.8125rem] leading-5'
const CONTAINER_LANDING = 'px-4 sm:px-6 min-[576px]:max-w-6xl min-[768px]:max-w-6xl min-[992px]:max-w-6xl min-[1200px]:max-w-6xl min-[1400px]:max-w-6xl'
const CONTAINER_DOCUMENT = 'px-6 min-[576px]:max-w-5xl min-[768px]:max-w-5xl min-[992px]:max-w-5xl min-[1200px]:max-w-5xl min-[1400px]:max-w-5xl'
const FOOTER_INNER = `${CONTAINER_DOCUMENT} flex flex-wrap items-center justify-center gap-2 text-xs text-ink-muted text-center`
const FOOTER_RESET_INNER = `${CONTAINER_DOCUMENT} flex flex-col items-center justify-center gap-4 text-[0.8125rem] leading-[1.125rem] text-ink-body text-center sm:flex-row`
const FOOTER_RESET_LINK = 'transition-colors duration-150 hover:text-ink'
const CHANGE_FOOTER_INNER = `${CONTAINER_DOCUMENT} text-center text-xs text-ink-muted`
const LINK = 'transition-colors duration-150 hover:text-ink'
const LINK_ACTIVE = 'text-ink-secondary font-medium'

const links = [
  { label: 'Terms', to: '/terms' },
  { label: 'Privacy', to: '/privacy' },
  { label: 'Contact', to: '/contact' },
]

const landingLinks = [
  { label: 'Terms', to: '/terms' },
  { label: 'Privacy', to: '/privacy' },
]

export type PublicFooterMode = 'auto' | 'auth'
export type PublicAuthFooterVariant = 'default' | 'login' | 'forget' | 'change' | 'reset-password'

export type PublicFooterProps = {
  mode?: PublicFooterMode
  variant?: PublicAuthFooterVariant
}

/** The minimal public footer shared by the landing and legal pages. */
export function PublicFooter({
  mode = 'auto',
  variant = 'default',
}: PublicFooterProps) {
  const { pathname } = useLocation()
  const isAuth = mode === 'auth'
  const isLanding = pathname === '/' && !isAuth
  const visibleLinks = isLanding ? landingLinks : links
  const isReset = variant === 'reset-password'
  const isChange = variant === 'change'
  const whiteFooter = variant === 'login' || variant === 'forget' || isChange
  const footerLinks = isReset
    ? [
        { label: 'Contact', to: '/contact' },
        { label: 'Privacy', to: '/privacy' },
        { label: 'Terms', to: '/terms' },
      ]
    : links
  const copyright = isReset
    ? `© 2025 ${app.name} Technologies Inc.`
    : `© 2025 ${app.name} Inc.`
  const linkClass = variant === 'login'
    ? 'transition-colors duration-150 hover:text-ink-secondary'
    : 'transition-colors duration-150 hover:text-ink-emphasis'

  if (isAuth && isReset) {
    return (
      <footer className="w-full py-6">
        <Container className={FOOTER_RESET_INNER}>
          <span>{copyright}</span>
          <div className="flex items-center gap-4">
            {footerLinks.map((link, index) => (
              <Fragment key={link.to}>
                {index > 0 ? <span aria-hidden="true">•</span> : null}
                <Link to={link.to} className={FOOTER_RESET_LINK}>{link.label}</Link>
              </Fragment>
            ))}
          </div>
        </Container>
      </footer>
    )
  }

  if (isAuth && isChange) {
    return (
      <footer className="w-full border-t border-border bg-surface py-6">
        <Container className={CHANGE_FOOTER_INNER}>
          <p>
            © 2025 {app.name} Inc. ·{' '}
            {links.map((link, index) => (
              <Fragment key={link.to}>
                {index > 0 ? ' · ' : null}
                <Link to={link.to} className={linkClass}>{link.label}</Link>
              </Fragment>
            ))}
          </p>
        </Container>
      </footer>
    )
  }

  if (isAuth) {
    return (
      <footer className={cn('w-full border-t border-border py-6', whiteFooter && 'bg-surface', whiteFooter && '[&>div]:max-sm:flex-col')}>
        <Container className={FOOTER_INNER}>
          <span>{copyright}</span>
          {links.map((link) => (
            <Fragment key={link.to}>
              <span aria-hidden="true" className={whiteFooter ? 'max-sm:hidden' : undefined}>·</span>
              <Link to={link.to} className={linkClass}>{link.label}</Link>
            </Fragment>
          ))}
        </Container>
      </footer>
    )
  }

  return (
    <footer
      className={cn(
        'w-full mt-auto border-t border-border',
        !isLanding && 'py-6',
        isLanding ? 'bg-canvas-muted' : 'bg-surface',
      )}
    >
      <Container
        className={cn(
          INNER,
          isLanding
            ? cn(INNER_LANDING, CONTAINER_LANDING)
            : cn(INNER_DEFAULT, CONTAINER_DOCUMENT),
        )}
      >
        <span>{isLanding ? `© 2026 ${app.name}` : `© 2025 ${app.name} Inc.`}</span>
        {visibleLinks.map((link) => (
          <Fragment key={link.to}>
            <span aria-hidden="true">·</span>
            <Link
              to={link.to}
              className={cn(
                LINK,
                !isLanding && pathname === '/privacy' && pathname === link.to && LINK_ACTIVE,
              )}
            >
              {link.label}
            </Link>
          </Fragment>
        ))}
      </Container>
    </footer>
  )
}
