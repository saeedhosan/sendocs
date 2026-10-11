import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import ownerThemeStyles from '../../styles/owner-themes.module.css'
import styles from './Dialog.module.css'

export type DialogProps = {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  tone?: 'default' | 'danger'
  /** Element to focus when the dialog opens; defaults to the first control. */
  initialFocusRef?: React.RefObject<HTMLElement | null>
  className?: string
  /** Centered modal presentation for reference-specific dialogs. */
  variant?: 'default' | 'centered' | 'compact-centered'
  /** Route palette to apply inside the body-level portal. */
  ownerTheme?: 'dashboard' | 'new-request' | 'request-detail' | 'link-reveal'
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * A modal dialog with a focus trap, Escape-to-close, and focus restoration.
 *
 * Confirmation intentionally focuses the caller-provided control (Cancel for
 * destructive actions) so Enter does not confirm by default.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  tone = 'default',
  initialFocusRef,
  className,
  variant = 'default',
  ownerTheme,
}: DialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const ownerThemeClass =
    ownerTheme === 'dashboard'
      ? ownerThemeStyles.dashboardTheme
      : ownerTheme === 'new-request'
        ? ownerThemeStyles.newRequestTheme
        : ownerTheme === 'request-detail'
          ? ownerThemeStyles.requestDetailTheme
          : ownerTheme === 'link-reveal'
            ? cn(ownerThemeStyles.newRequestTheme, ownerThemeStyles.linkRevealTheme)
            : undefined

  useEffect(() => {
    if (!open) {
      return
    }

    const previouslyFocused = document.activeElement as HTMLElement | null

    const focusTarget =
      initialFocusRef?.current ??
      panelRef.current?.querySelector<HTMLElement>(FOCUSABLE) ??
      panelRef.current

    focusTarget?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const focusable = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
      ).filter((element) => element.offsetParent !== null || element === focusTarget)

      if (focusable.length === 0) {
        event.preventDefault()
        panelRef.current?.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = overflow
      previouslyFocused?.focus?.()
    }
  }, [open, onClose, initialFocusRef])

  if (!open) {
    return null
  }

  return createPortal(
    <div
      className={cn(
        styles.overlay,
        ownerThemeClass,
        variant !== 'default' && styles.centeredOverlay,
        variant === 'compact-centered' && styles.compactCenteredOverlay,
      )}
      onMouseDown={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          styles.panel,
          styles[tone],
          variant === 'centered' && styles.centeredPanel,
          variant === 'compact-centered' && styles.compactCenteredPanel,
          className,
        )}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.body}>
          <h2 id={titleId} className={cn(styles.title, variant === 'centered' && styles.centeredTitle)}>
            {title}
          </h2>
          {description ? (
            <p
              id={descriptionId}
              className={cn(
                styles.description,
                variant === 'centered' && styles.centeredDescription,
              )}
            >
              {description}
            </p>
          ) : null}
          {children}
        </div>
        {footer ? <div className={styles.footer}>{footer}</div> : null}
      </div>
    </div>,
    document.body,
  )
}
