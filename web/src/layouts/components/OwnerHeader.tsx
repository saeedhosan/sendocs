import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
const TRIGGER_BASE = 'inline-flex items-center cursor-pointer transition-colors duration-150 hover:text-ink'
const TRIGGER_DASHBOARD = cn(
  TRIGGER_BASE,
  'gap-1.5 min-h-11 px-3 py-2 rounded-[8px] bg-transparent text-[0.8125rem] font-medium text-ink-secondary hover:bg-surface-subtle',
)
const AVATAR =
  'inline-flex items-center justify-center size-6 rounded-full bg-surface-sunken font-mono text-[0.6875rem] font-medium text-ink-secondary'
const MENU_DASHBOARD =
  'absolute right-0 top-[calc(100%+0.25rem)] z-50 w-48 p-1 border border-border-subtle rounded-[10px] bg-surface shadow-lg'
const EMAIL =
  'px-3 py-2 border-b border-border-subtle/80 font-mono text-[0.6875rem] text-ink-muted overflow-hidden text-ellipsis whitespace-nowrap'
const ITEM_BASE =
  'flex items-center gap-2 w-full min-h-11 px-3.5 py-2.5 border-t border-border-subtle bg-transparent text-[0.8125rem] text-left cursor-pointer transition-colors duration-150'
const ITEM = cn(ITEM_BASE, 'text-ink-secondary hover:bg-surface-muted hover:text-ink')
const SIGN_OUT = cn(ITEM_BASE, 'text-danger-text hover:bg-danger-surface')

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
    <header className={HEADER}>
      <Container className={cn(INNER, INNER_DASHBOARD)}>
        <Logo to="/dashboard" variant="owner" className="gap-2" />
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className={TRIGGER_DASHBOARD}
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <span className={AVATAR} aria-hidden="true">
              {initials(displayName)}
            </span>
            <span>Account</span>
            <ChevronDownIcon size={14} className="text-ink-muted" />
          </button>
          {open ? (
            <div
              className={MENU_DASHBOARD}
              role="menu"
            >
              <p className={EMAIL}>{user?.email}</p>
              <Link
                to="/settings/password"
                role="menuitem"
                className={ITEM}
                onClick={() => setOpen(false)}
              >
                <LockResetIcon size={16} />
                Change password
              </Link>
              <Link
                to="/settings/delete"
                role="menuitem"
                className={ITEM}
                onClick={() => setOpen(false)}
              >
                <TrashIcon size={16} />
                Delete account
              </Link>
              <button
                type="button"
                role="menuitem"
                className={SIGN_OUT}
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
