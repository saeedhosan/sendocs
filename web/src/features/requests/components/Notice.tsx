import { useEffect } from 'react'
import { AlertIcon, CheckCircleIcon } from '../../../components/icons'

export type NoticeTone = 'ok' | 'error'

export type NoticeProps = {
  tone: NoticeTone
  message: string
  onDismiss: () => void
  /** Auto-dismiss delay; four seconds matches the owner references. */
  duration?: number
}

/** Non-blocking outcome toast. Always paired with in-page state, never sole feedback. */
export function Notice({ tone, message, onDismiss, duration = 4000 }: NoticeProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, duration)

    return () => window.clearTimeout(timer)
  }, [onDismiss, duration])

  return (
    <div
      className="fixed right-5 bottom-5 z-[60] inline-flex items-center gap-2 max-w-[min(24rem,calc(100vw-2.5rem))] px-3.5 py-2 rounded-md bg-ink text-[0.8125rem] text-white shadow-md"
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
    >
      {tone === 'error' ? (
        <AlertIcon size={16} className="shrink-0 text-danger" />
      ) : (
        <CheckCircleIcon size={16} className="shrink-0 text-success" />
      )}
      <span>{message}</span>
    </div>
  )
}
