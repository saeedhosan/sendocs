import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../app/providers/useAuth'
import { Logo } from '../../components/navigation/Logo'
import { Container } from '../../components/ui'
import { ChevronDownIcon, LockResetIcon, LogoutIcon, TrashIcon } from '../../components/icons'
import { cn } from '../../lib/cn'

const HEADER =
  'sticky top-0 z-30 w-full border-b border-border bg-surface'
const INNER = 'flex items-center justify-between gap-4'
const INNER_DASHBOARD =
  'min-h-16 py-3 px-4 sm:px-6 min-[576px]:max-w-5xl min-[768px]:max-w-5xl min-[992px]:max-w-5xl min-[1200px]:max-w-5xl min-[1400px]:max-w-5xl'
const INNER_CREATE =
  'py-3.5 px-4 sm:px-6 min-[576px]:max-w-2xl min-[768px]:max-w-2xl min-[992px]:max-w-2xl min-[1200px]:max-w-2xl min-[1400px]:max-w-2xl'
const INNER_DETAIL =
  'py-3.5 px-4 sm:px-6 min-[576px]:max-w-4xl min-[768px]:max-w-4xl min-[992px]:max-w-4xl min-[1200px]:max-w-4xl min-[1400px]:max-w-4xl'
const TRIGGER_BASE = 'inline-flex items-center cursor-pointer transition-colors duration-150 hover:text-ink'
const TRIGGER_DASHBOARD = cn(
  TRIGGER_BASE,
  'gap-1.5 min-h-11 px-3 py-2 rounded-[8px] bg-transparent text-[0.8125rem] font-medium text-ink-secondary hover:bg-surface-muted',
)
const TRIGGER_CREATE = cn(
  TRIGGER_BASE,
  'gap-1 min-h-11 py-2 text-[0.8125rem] font-medium text-ink-secondary',
)
const TRIGGER_DETAIL = cn(
  TRIGGER_BASE,
  'gap-1 py-1 text-xs font-medium text-neutral-600 hover:text-neutral-900',
)
const AVATAR =
  'inline-flex items-center justify-center size-6 rounded-full bg-surface-sunken font-mono text-[0.6875rem] font-medium text-ink-secondary'
const MENU_DASHBOARD =
  'absolute right-0 top-[calc(100%+0.25rem)] z-50 w-48 p-1 border border-border-subtle rounded-[10px] bg-surface shadow-lg'
const MENU_CREATE =
  'absolute right-0 top-[calc(100%+0.375rem)] z-50 w-40 border border-border-subtle rounded-[10px] bg-surface shadow-sm py-1'
const MENU_DETAIL =
  'absolute right-0 top-[calc(100%+0.5rem)] z-50 w-44 border border-neutral-200 rounded-[10px] bg-white shadow-md py-1 divide-y divide-neutral-100'
const EMAIL =
  'px-3 py-2 border-b border-border-subtle/80 font-mono text-[0.6875rem] text-ink-muted overflow-hidden text-ellipsis whitespace-nowrap'
const ITEM_BASE =
  'flex items-center gap-2 w-full min-h-11 px-3.5 py-2.5 border-t border-border-subtle bg-transparent text-[0.8125rem] text-left cursor-pointer transition-colors duration-150'
const ITEM = cn(ITEM_BASE, 'text-ink-secondary hover:bg-surface-muted hover:text-ink')
const SIGN_OUT = cn(ITEM_BASE, 'text-danger-text hover:bg-danger-surface')
const COMPACT_ITEM_BASE =
  'flex items-center gap-2 w-full px-3 py-2 text-[0.8125rem] text-left text-ink-secondary hover:text-ink hover:bg-surface-muted transition-colors duration-150'
const DETAIL_ITEM_BASE =
  'flex items-center gap-2 w-full px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50 transition-colors duration-150'
const COMPACT_ITEM = COMPACT_ITEM_BASE
const COMPACT_SIGN_OUT = cn(COMPACT_ITEM_BASE, 'border-t border-border-subtle')
const DETAIL_ITEM = DETAIL_ITEM_BASE
const DETAIL_SIGN_OUT = DETAIL_ITEM_BASE

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) {
    return '?'
  }

  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''

  return `${first}${last}`.toUpperCase()
}

export function OwnerHeader() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const pathname = useLocation().pathname
  const isDashboard = pathname === '/dashboard'
  const isCreateRequest = pathname === '/requests/new'
  const isRequestDetail = !isCreateRequest && /^\/requests\/[^/]+$/.test(pathname)
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

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
    <header className={cn(HEADER, isCreateRequest && 'border-border-subtle')}>
      <Container
        className={cn(
          INNER,
          isDashboard
            ? INNER_DASHBOARD
            : isCreateRequest
              ? INNER_CREATE
              : INNER_DETAIL,
        )}
      >
        {isDashboard ? (
          <Logo to="/dashboard" variant="owner" className="gap-2" />
        ) : (
          <Link
            to="/dashboard"
            className={
              isCreateRequest
                ? 'font-semibold text-[0.9375rem] tracking-tight text-ink'
                : 'font-semibold text-sm tracking-tight text-neutral-900'
            }
          >
            Sendocs
          </Link>
        )}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className={
              isDashboard
                ? TRIGGER_DASHBOARD
                : isCreateRequest
                  ? TRIGGER_CREATE
                  : TRIGGER_DETAIL
            }
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {isDashboard ? (
              <span className={AVATAR} aria-hidden="true">
                {initials(displayName)}
              </span>
            ) : null}
            <span>Account</span>
            <ChevronDownIcon
              size={16}
              className={isRequestDetail ? 'text-neutral-400' : 'text-ink-muted'}
            />
          </button>
          {open ? (
            <div
              className={
                isDashboard
                  ? MENU_DASHBOARD
                  : isCreateRequest
                    ? MENU_CREATE
                    : MENU_DETAIL
              }
              role="menu"
            >
              {isDashboard ? <p className={EMAIL}>{user?.email}</p> : null}
              <Link
                to="/settings/password"
                role="menuitem"
                className={
                  isDashboard ? ITEM : isCreateRequest ? COMPACT_ITEM : DETAIL_ITEM
                }
                onClick={() => setOpen(false)}
              >
                <LockResetIcon size={16} />
                Change password
              </Link>
              {isDashboard ? (
                <Link
                  to="/settings/delete"
                  role="menuitem"
                  className={ITEM}
                  onClick={() => setOpen(false)}
                >
                  <TrashIcon size={16} />
                  Delete account
                </Link>
              ) : null}
              <button
                type="button"
                role="menuitem"
                className={
                  isDashboard
                    ? SIGN_OUT
                    : isCreateRequest
                      ? COMPACT_SIGN_OUT
                      : DETAIL_SIGN_OUT
                }
                onClick={handleSignOut}
              >
                <LogoutIcon size={16} />
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </Container>
    </header>
  )
}
