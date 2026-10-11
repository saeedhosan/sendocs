import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../app/providers/useAuth'
import { Logo } from '../../components/navigation/Logo'
import { Container } from '../../components/ui'
import { cn } from '../../lib/cn'

const HEADER = 'top-0 z-50 w-full border-b border-border'
const HEADER_HOME = 'fixed bg-white/90 backdrop-blur-[12px]'
const INNER = 'flex items-center justify-between gap-4 min-h-16'
const INNER_HOME = 'min-h-14'
const CONTAINER_HOME = 'px-4 sm:px-6 min-[576px]:max-w-6xl min-[768px]:max-w-6xl min-[992px]:max-w-6xl min-[1200px]:max-w-6xl min-[1400px]:max-w-6xl'
const CONTAINER_DOCUMENT = 'px-6 min-[576px]:max-w-5xl min-[768px]:max-w-5xl min-[992px]:max-w-5xl min-[1200px]:max-w-5xl min-[1400px]:max-w-5xl'
const ACTIONS = 'flex items-center gap-3'
const LOGIN_LINK =
  'px-3 py-1.5 text-[0.8125rem] font-medium text-marketing-text-secondary transition-colors duration-150 hover:text-ink'
const GET_STARTED =
  'inline-flex items-center justify-center min-h-[2.125rem] px-3.5 rounded-[10px] bg-primary text-on-primary text-[0.8125rem] font-medium shadow-sm transition-colors duration-150 hover:bg-primary-hover'
const NAV = 'flex items-center gap-6 text-sm max-[480px]:gap-4'
const NAV_LINK = 'text-ink-body transition-colors duration-150 hover:text-ink'
const NAV_LINK_ACTIVE = 'text-primary font-semibold'
const NAV_SIGN_IN = 'pl-2'

const documentLinks = [
  { label: 'Terms', to: '/terms' },
  { label: 'Privacy', to: '/privacy' },
  { label: 'Security', to: '/contact' },
]

/**
 * The minimal public header shared by the landing and legal pages.
 *
 * The marketing home shows the two conversion actions; the legal documents
 * show a small anchor navigation with the current page highlighted. Signed-in
 * visitors see a dashboard link instead of the sign-up actions, since the
 * public pages stay reachable once authenticated.
 */
export function PublicHeader() {
  const { pathname } = useLocation()
  const { status } = useAuth()
  const isAuthenticated = status === 'authenticated'
  const isLanding = pathname === '/'
  const isDocument = documentLinks.some((link) => link.to === pathname)

  return (
    <header
      className={cn(
        HEADER,
        !isLanding && 'sticky',
        isLanding ? HEADER_HOME : 'bg-surface',
      )}
    >
      <Container
        className={cn(
          INNER,
          isLanding ? cn(INNER_HOME, CONTAINER_HOME) : CONTAINER_DOCUMENT,
        )}
      >
        <Logo variant={isLanding ? 'brand' : 'auth'} />

        {isDocument ? (
          <nav className={NAV} aria-label="Legal">
            {documentLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(NAV_LINK, isActive && NAV_LINK_ACTIVE)
                }
              >
                {link.label}
              </NavLink>
            ))}
            {isAuthenticated ? (
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  cn(NAV_LINK, NAV_SIGN_IN, isActive && NAV_LINK_ACTIVE)
                }
              >
                Dashboard
              </NavLink>
            ) : (
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  cn(NAV_LINK, NAV_SIGN_IN, isActive && NAV_LINK_ACTIVE)
                }
              >
                Sign in
              </NavLink>
            )}
          </nav>
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
