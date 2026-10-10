import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../app/providers/useAuth'
import { Logo } from '../../components/navigation/Logo'
import { ChevronDownIcon, LockIcon, LogoutIcon, TrashIcon } from '../../components/icons'
import styles from './OwnerHeader.module.css'

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
    <header className={styles.header}>
      <div className={styles.inner}>
        <Logo />
        <div className={styles.menuWrap} ref={menuRef}>
          <button
            type="button"
            className={styles.trigger}
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <span className={styles.avatar} aria-hidden="true">
              {initials(displayName)}
            </span>
            <span>{displayName}</span>
            <ChevronDownIcon size={16} />
          </button>
          {open ? (
            <div className={styles.menu} role="menu">
              <p className={styles.email}>{user?.email}</p>
              <Link
                to="/settings/password"
                role="menuitem"
                className={styles.item}
                onClick={() => setOpen(false)}
              >
                <LockIcon size={16} />
                Change password
              </Link>
              <Link
                to="/settings/delete"
                role="menuitem"
                className={styles.item}
                onClick={() => setOpen(false)}
              >
                <TrashIcon size={16} />
                Delete account
              </Link>
              <button
                type="button"
                role="menuitem"
                className={styles.signOut}
                onClick={handleSignOut}
              >
                <LogoutIcon size={16} />
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
