import { useLocation } from 'react-router-dom'
import { Menu } from '../../components/navigation/Menu'
import { FOOTER_ITEMS } from '../../components/navigation/menu-items'
import { Container } from '../../components/ui'
import { cn } from '../../lib/cn'
import { app } from '../../config/app'

const INNER =
  'flex flex-wrap items-center justify-center gap-2 text-ink-muted text-center'
const INNER_DEFAULT = 'text-xs leading-4'
const INNER_LANDING = 'min-h-14 text-[0.8125rem] leading-5'
const FOOTER_INNER = 'flex flex-wrap items-center justify-center gap-2 text-xs text-ink-muted text-center'
const FOOTER_RESET_INNER = 'flex flex-col items-center justify-center gap-4 text-[0.8125rem] leading-[1.125rem] text-ink-body text-center sm:flex-row'
const FOOTER_RESET_LINK = 'transition-colors duration-150 hover:text-ink'
const CHANGE_FOOTER_INNER = 'text-center text-xs text-ink-muted'
const LINK = 'transition-colors duration-150 hover:text-ink'
const LINK_ACTIVE = 'text-ink-secondary font-medium'

export type PublicFooterMode = 'auto' | 'auth'
export type PublicAuthFooterVariant = 'default' | 'login' | 'forget' | 'change' | 'reset-password'

export type PublicFooterProps = {
  mode?: PublicFooterMode
  variant?: PublicAuthFooterVariant
}

/** The minimal public footer shared by the landing, legal, and auth pages. */
export function PublicFooter({
  mode = 'auto',
  variant = 'default',
}: PublicFooterProps) {
  const { pathname } = useLocation()
  const isAuth = mode === 'auth'
  const isLanding = pathname === '/' && !isAuth
  const isReset = variant === 'reset-password'
  const isChange = variant === 'change'
  const whiteFooter = variant === 'login' || variant === 'forget' || isChange
  const visibleLinks = isReset ? [...FOOTER_ITEMS].reverse() : FOOTER_ITEMS
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
            <Menu
              as="span"
              items={visibleLinks}
              separator="•"
              itemClassName={FOOTER_RESET_LINK}
              highlightActive={false}
            />
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
            <Menu
              as="span"
              className="inline"
              items={FOOTER_ITEMS}
              separator=" · "
              itemClassName={linkClass}
              highlightActive={false}
            />
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
          <Menu
            as="span"
            items={FOOTER_ITEMS}
            separator="·"
            leadingSeparator
            className="inline-flex items-center gap-2"
            itemClassName={linkClass}
            highlightActive={false}
            separatorClassName={whiteFooter ? 'max-sm:hidden' : undefined}
          />
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
          isLanding ? INNER_LANDING : INNER_DEFAULT,
        )}
      >
        <span>{isLanding ? `© 2026 ${app.name}` : `© 2025 ${app.name} Inc.`}</span>
        <Menu
          as="span"
          className="inline-flex items-center gap-2"
          items={FOOTER_ITEMS}
          separator="·"
          leadingSeparator
          itemClassName={LINK}
          activeClassName={LINK_ACTIVE}
        />
      </Container>
    </footer>
  )
}