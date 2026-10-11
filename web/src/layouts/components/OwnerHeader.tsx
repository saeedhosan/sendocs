import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../app/providers/useAuth'
import { Logo } from '../../components/navigation/Logo'
import { Container } from '../../components/ui'
import { ChevronDownIcon, LockResetIcon, LogoutIcon, TrashIcon } from '../../components/icons'
import { cn } from '../../lib/cn'

const HEADER =
  'sticky top-0 z-30 w-full border-b border-border bg-surface'
const INNER = 'flex items-center justify-between gap-4 min-h-16 py-3'
const TRIGGER =
  'inline-flex items-center gap-1.5 min-h-11 px-3 py-2 rounded-[8px] bg-transparent text-[0.8125rem] font-medium text-ink-secondary cursor-pointer transition-colors duration-150 hover:bg-surface-muted hover:text-ink'
const AVATAR =
  'inline-flex items-center justify-center size-6 rounded-full bg-surface-sunken font-mono text-[0.6875rem] font-medium text-ink-secondary'
const MENU =
  'absolute right-0 top-[calc(100%+0.25rem)] z-50 w-52 p-1 border border-border rounded-md bg-surface shadow-md'
const EMAIL =
  'px-3 py-2 border-b border-border-subtle font-mono text-[0.6875rem] text-ink-muted overflow-hidden text-ellipsis whitespace-nowrap'
const ITEM_BASE =
  'flex items-center gap-2 w-full min-h-10 px-3.5 py-2.5 border-t border-border-subtle bg-transparent text-[0.8125rem] text-left cursor-pointer transition-colors duration-150'
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
  const isDashboard = useLocation().pathname === '/dashboard'
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
      <Container className={INNER}>
        <Logo to="/dashboard" />
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className={TRIGGER}
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
            <ChevronDownIcon size={16} />
          </button>
          {open ? (
            <div className={MENU} role="menu">
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
