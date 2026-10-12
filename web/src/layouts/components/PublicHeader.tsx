import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../app/providers/useAuth'
import { Logo } from '../../components/navigation/Logo'
import { Menu } from '../../components/navigation/Menu'
import { MENU_ITEMS } from '../../components/navigation/menu-items'
import { Container } from '../../components/ui'
import { cn } from '../../lib/cn'

const HEADER = 'top-0 z-50 w-full border-b border-border'
const HEADER_HOME = 'fixed bg-white/90 backdrop-blur-[12px]'
const INNER = 'flex items-center justify-between gap-4 min-h-16'
const INNER_HOME = '!min-h-14'
const ACTIONS = 'flex items-center gap-3'
const LOGIN_LINK =
  'px-3 py-1.5 text-[0.8125rem] font-medium text-marketing-text-secondary transition-colors duration-150 hover:text-ink'
const GET_STARTED =
  'inline-flex items-center justify-center min-h-[2.125rem] px-3.5 rounded-[10px] bg-primary text-on-primary text-[0.8125rem] font-medium shadow-sm transition-colors duration-150 hover:bg-primary-hover'
const NAV = 'flex items-center gap-6 text-sm max-[480px]:gap-4'

const documentPaths = MENU_ITEMS.slice(0, 3).map(({ to }) => to)

const headerItems = (isAuthenticated: boolean) =>
  isAuthenticated
    ? [...MENU_ITEMS.slice(0, 3), { label: 'Dashboard', to: '/dashboard' }]
    : MENU_ITEMS

export type PublicHeaderMode = 'auto' | 'auth'

export type PublicHeaderProps = {
  mode?: PublicHeaderMode
  authAction?: { label: string; to: string }
}

/**
 * The minimal public header shared by the landing and legal pages.
 *
 * The marketing home shows the two conversion actions; the legal documents
 * show a small anchor navigation with the current page highlighted. Signed-in
 * visitors see a dashboard link instead of the sign-up actions, since the
 * public pages stay reachable once authenticated.
 */
export function PublicHeader({
  mode = 'auto',
  authAction,
}: PublicHeaderProps) {
  const { pathname } = useLocation()
  const { status } = useAuth()
  const isAuthenticated = status === 'authenticated'
  const isAuth = mode === 'auth'
  const isLanding = pathname === '/' && !isAuth
  const isDocument = documentPaths.includes(pathname)

  return (
    <header
      className={cn(
        HEADER,
        !isLanding && !isAuth && 'sticky',
        isLanding ? HEADER_HOME : 'bg-surface',
      )}
    >
      <Container className={cn(INNER, isLanding && INNER_HOME)}>
        <Logo variant="brand" />

        {isAuth ? (
          authAction ? (
            <Link
              to={authAction.to}
              className="text-sm font-medium text-ink-muted transition-colors duration-150 hover:text-ink"
            >
              {authAction.label}
            </Link>
          ) : null
        ) : isDocument ? (
          <Menu
            variant="header"
            ariaLabel="Menu"
            className={NAV}
            items={headerItems(isAuthenticated)}
          />
        ) : isAuthenticated ? (
          <div className={ACTIONS}>
            <Link to="/dashboard" className={GET_STARTED}>
              Dashboard
            </Link>
          </div>
        ) : (
          <div className={ACTIONS}>
            <Link to="/login" className={LOGIN_LINK}>
              Log in
            </Link>
            <Link to="/register" className={GET_STARTED}>
              Get started
            </Link>
          </div>
        )}
      </Container>
    </header>
  )
}
