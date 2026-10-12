import { useEffect, useRef, useState } from 'react'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../app/providers/useAuth'
import { ChevronDownIcon, LockResetIcon, LogoutIcon, TrashIcon, UserIcon } from '../../components/icons'
import { Logo } from '../../components/navigation/Logo'
import { Container, Link, ThemeToggle } from '../../components/ui'
import { cn } from '../../lib/cn'

const ACTIONS = 'flex items-center gap-3'
const MENU_GROUP = 'py-1'
const ITEM = 'flex items-center gap-2 w-full px-3 py-2 text-sm text-left cursor-pointer transition-colors duration-150 text-ink-secondary hover:bg-surface-muted hover:text-ink'
const ICON = 'size-4 shrink-0'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) {
    return '?'
  }

  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''

  return `${first}${last}`.toUpperCase()
}

export type HeaderMode = 'auto' | 'auth'

export type HeaderProps = {
  mode?: HeaderMode
  authAction?: { label: string; to: string }
}

/**
 * Single header used across the entire app. For auth pages, pass mode="auth" and
 * optionally authAction; for authenticated users show the user menu on all pages.
 */
export function Header({ mode = 'auto', authAction }: HeaderProps) {
  const { pathname } = useLocation()
  const { user, logout, status } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isAuthenticated = status === 'authenticated'
  const isAuth = mode === 'auth'
  const isLanding = pathname === '/' && !isAuth

  useEffect(() => {
    if (!open) {
      return
    }

    function handlePointer(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('keydown', handleKey)

    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  async function handleSignOut() {
    await logout()
    navigate('/login', { replace: true })
  }

  const displayName = user?.name ?? 'Account'

  return (
    <header
      className={cn(
        'top-0 z-50 w-full border-b border-border',
        isLanding || isAuthenticated ? 'fixed backdrop-blur-[12px] bg-surface/80' : 'sticky bg-surface',
      )}
    >
      <Container className={cn('flex items-center justify-between gap-4 min-h-16', (isLanding || isAuthenticated) && '!min-h-14')}>
        <Logo variant="brand" />

        {isAuth ? (
          authAction ? (
            <Link to={authAction.to} variant="ghost" size="sm">
              {authAction.label}
            </Link>
          ) : null
        ) : isAuthenticated ? (
          <div className={ACTIONS}>
            <ThemeToggle />
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                className="inline-flex items-center cursor-pointer transition-colors duration-150 hover:text-ink gap-2 min-h-8 px-3 py-1.5 rounded-md bg-transparent text-[0.8125rem] font-medium text-ink-secondary hover:bg-surface-subtle"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label={`${displayName}'s account menu`}
                onClick={() => setOpen((value) => !value)}
              >
                <span className="inline-flex items-center justify-center size-8 rounded-full bg-surface-sunken text-ink-secondary font-medium text-sm" aria-hidden="true">
                  {initials(displayName)}
                </span>
                <ChevronDownIcon size={14} className="text-ink-muted" />
              </button>
              {open ? (
                <div
                  className="absolute right-0 top-full z-50 mt-1.5 min-w-[200px] border border-border-subtle rounded-lg bg-surface shadow-lg py-1 shadow-md dark:shadow-gray-900/50"
                  role="menu"
                  aria-orientation="vertical"
                >
                  <div className="px-3 py-2 border-b border-border-subtle">
                    <p className="text-sm font-medium text-ink truncate">{displayName}</p>
                    <p className="text-xs text-ink-muted truncate">{user?.email}</p>
                  </div>

                  <div className={MENU_GROUP} role="none">
                    <RouterLink
                      to="/dashboard"
                      role="menuitem"
                      className={ITEM}
                      onClick={() => setOpen(false)}
                    >
                      <UserIcon size={16} className={ICON} aria-hidden="true" />
                      Dashboard
                    </RouterLink>
                    <RouterLink
                      to="/settings/password"
                      role="menuitem"
                      className={ITEM}
                      onClick={() => setOpen(false)}
                    >
                      <LockResetIcon size={16} className={ICON} aria-hidden="true" />
                      Change password
                    </RouterLink>
                    <RouterLink
                      to="/settings/delete"
                      role="menuitem"
                      className={ITEM}
                      onClick={() => setOpen(false)}
                    >
                      <TrashIcon size={16} className={ICON} aria-hidden="true" />
                      Delete account
                    </RouterLink>
                  </div>

                  <div className="h-px bg-border-subtle my-1" role="separator" />

                  <div className={MENU_GROUP} role="none">
                    <button
                      type="button"
                      role="menuitem"
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left cursor-pointer transition-colors duration-150 text-danger-text hover:bg-danger-surface hover:text-danger-text"
                      onClick={handleSignOut}
                    >
                      <LogoutIcon size={16} className={ICON} aria-hidden="true" />
                      Sign out
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className={ACTIONS}>
            <ThemeToggle />
            <Link to="/login" variant="ghost" size="sm">
              Log in
            </Link>
            <Link to="/register" variant="primary" size="sm">
              Get started
            </Link>
          </div>
        )}
      </Container>
    </header>
  )
}