import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

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
  variant?: 'default' | 'centered'
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

const OVERLAY_BASE =
  'fixed inset-0 z-50 flex justify-center p-4 bg-[rgba(18,17,19,0.4)]'

const PANEL_BASE =
  'w-full p-5 border border-border-strong bg-surface focus:outline-none'

const FOOTER_BASE =
  'flex flex-col-reverse gap-2 [&>*]:w-full sm:flex-row sm:items-center sm:justify-end sm:[&>*]:w-auto'

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
}: DialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

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

  const overlayClass = cn(
    OVERLAY_BASE,
    'items-center',
    variant === 'centered'
      ? 'backdrop-blur-[2px]'
      : 'max-sm:items-end max-sm:p-0',
  )

  const panelClass = cn(
    PANEL_BASE,
    variant === 'centered'
      ? 'max-w-lg rounded-[10px] shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] sm:p-6'
      : 'max-w-sm rounded-md shadow-md max-sm:max-w-none max-sm:rounded-b-none max-sm:border-b-0',
    className,
  )

  const titleClass = cn(
    'font-semibold',
    tone === 'danger' ? 'text-danger-text' : 'text-ink',
    variant === 'centered'
      ? 'text-[1.0625rem] leading-6 tracking-[-0.01em] sm:text-lg sm:leading-7'
      : 'text-sm',
  )

  const descriptionClass =
    variant === 'centered'
      ? 'mt-1 text-[0.8125rem] leading-5 text-ink-secondary'
      : 'mt-1.5 text-xs leading-[1.5] text-ink-secondary'

  const footerClass =
    variant === 'centered' ? cn(FOOTER_BASE, 'mt-2') : cn(FOOTER_BASE, 'mt-4')

  return createPortal(
    <div className={overlayClass} onMouseDown={onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={panelClass}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div>
          <h2 id={titleId} className={titleClass}>
            {title}
          </h2>
          {description ? (
            <p id={descriptionId} className={descriptionClass}>
              {description}
            </p>
          ) : null}
          {children}
        </div>
        {footer ? <div className={footerClass}>{footer}</div> : null}
      </div>
    </div>,
    document.body,
  )
}
