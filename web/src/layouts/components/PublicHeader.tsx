import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../app/providers/useAuth'
import { Logo } from '../../components/navigation/Logo'
import { cn } from '../../lib/cn'
import styles from './PublicHeader.module.css'

const documentLinks = [
  { label: 'Terms', to: '/terms' },
  { label: 'Privacy', to: '/privacy' },
  { label: 'Contact', to: '/contact' },
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
    <header className={cn(styles.header, isLanding && styles.homeHeader)}>
      <div className={cn(styles.inner, isLanding && styles.homeInner)}>
        <Logo letterMark={isLanding} compact={isLanding} />

        {isDocument ? (
          <nav className={styles.nav} aria-label="Legal">
            {documentLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(styles.navLink, isActive && styles.navLinkActive)
                }
              >
                {link.label}
              </NavLink>
            ))}
            {isAuthenticated ? (
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  cn(
                    styles.navLink,
                    styles.navSignIn,
                    isActive && styles.navLinkActive,
                  )
                }
              >
                Dashboard
              </NavLink>
            ) : (
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  cn(
                    styles.navLink,
                    styles.navSignIn,
                    isActive && styles.navLinkActive,
                  )
                }
              >
                Sign in
              </NavLink>
            )}
          </nav>
        ) : isAuthenticated ? (
          <div className={styles.actions}>
            <Link to="/dashboard" className={styles.getStarted}>
              Dashboard
            </Link>
          </div>
        ) : (
          <div className={styles.actions}>
            <Link to="/login" className={styles.loginLink}>
              Log in
            </Link>
            <Link to="/register" className={styles.getStarted}>
              Get started
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
