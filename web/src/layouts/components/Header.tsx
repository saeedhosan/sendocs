import { useEffect, useRef, useState } from 'react'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../app/providers/useAuth'
import { Logo } from '../../components/navigation/Logo'
import { Container } from '../../components/ui'
import { Link } from '../../components/ui'
import { ChevronDownIcon, LockResetIcon, LogoutIcon, TrashIcon, UserIcon } from '../../components/icons'
import { cn } from '../../lib/cn'

const HEADER = 'top-0 z-50 w-full border-b border-border'
const HEADER_HOME = 'fixed bg-white/90 backdrop-blur-[12px]'
const INNER = 'flex items-center justify-between gap-4 min-h-16'
const INNER_HOME = '!min-h-14'
const ACTIONS = 'flex items-center gap-3'
const TRIGGER_BASE = 'inline-flex items-center cursor-pointer transition-colors duration-150 hover:text-ink'
const TRIGGER_DASHBOARD = cn(
  TRIGGER_BASE,
  'gap-2 min-h-8 px-3 py-1.5 rounded-md bg-transparent text-[0.8125rem] font-medium text-ink-secondary hover:bg-surface-subtle',
)
const AVATAR = cn(
  'inline-flex items-center justify-center size-8 rounded-full bg-primary/10 text-primary font-medium text-sm',
  'ring-2 ring-white dark:ring-gray-800'
)
const MENU_DASHBOARD = cn(
  'absolute right-0 top-full z-50 mt-1.5 min-w-[200px]',
  'border border-border-subtle rounded-lg bg-surface shadow-lg py-1',
  'shadow-md dark:shadow-gray-900/50'
)
const USER_INFO = 'px-3 py-2 border-b border-border-subtle'
const USER_NAME = 'text-sm font-medium text-ink truncate'
const USER_EMAIL = 'text-xs text-ink-muted truncate'
const MENU_GROUP = 'py-1'
const ITEM_BASE = 'flex items-center gap-2 w-full px-3 py-2 text-sm text-left cursor-pointer transition-colors duration-150'
const ITEM = cn(ITEM_BASE, 'text-ink-secondary hover:bg-surface-muted hover:text-ink')
const ITEM_DESTRUCTIVE = cn(ITEM_BASE, 'text-danger-text hover:bg-danger-surface hover:text-danger-text')
const ICON = 'size-4 shrink-0'
const DIVIDER = 'h-px bg-border-subtle my-1'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) {
    return '?'
  }

  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''

  return `${first}${last}`.toUpperCase()
}

function getAvatarColor(name: string): string {
  const colors = [
    'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
    'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
    'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
    'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
    'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    'bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900/30 dark:text-fuchsia-400',
    'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
    'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export type HeaderMode = 'auto' | 'auth'

export type HeaderProps = {
  mode?: HeaderMode
  authAction?: { label: string; to: string }
}

/**
 * Single header used across the entire app. For auth pages, pass mode="auth" and
 * optionally authAction; for authenticated users on owner surfaces show the
 * user menu with dashboard link, settings, and sign out.
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
  const isOwnerArea = isAuthenticated && (pathname.startsWith('/dashboard') || pathname.startsWith('/requests') || pathname.startsWith('/settings'))

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
  const avatarColor = getAvatarColor(displayName)

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
            <Link to={authAction.to} variant="ghost" size="sm">
              {authAction.label}
            </Link>
          ) : null
        ) : isOwnerArea ? (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              className={TRIGGER_DASHBOARD}
              aria-haspopup="menu"
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
            >
              <span className={cn(AVATAR, avatarColor)} aria-hidden="true">
                {initials(displayName)}
              </span>
              <span className="hidden sm:inline font-medium text-ink-secondary">{displayName}</span>
              <ChevronDownIcon size={14} className="text-ink-muted" />
            </button>
            {open ? (
              <div
                className={MENU_DASHBOARD}
                role="menu"
                aria-orientation="vertical"
              >
                <div className={USER_INFO}>
                  <p className={USER_NAME}>{displayName}</p>
                  <p className={USER_EMAIL}>{user?.email}</p>
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

                <div className={DIVIDER} role="separator" />

                <div className={MENU_GROUP} role="none">
                  <button
                    type="button"
                    role="menuitem"
                    className={ITEM_DESTRUCTIVE}
                    onClick={handleSignOut}
                  >
                    <LogoutIcon size={16} className={ICON} aria-hidden="true" />
                    Sign out
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : isAuthenticated ? (
          <div className={ACTIONS}>
            <Link to="/dashboard" variant="primary" size="sm">
              Dashboard
            </Link>
          </div>
        ) : (
          <div className={ACTIONS}>
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