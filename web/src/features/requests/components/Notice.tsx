import { useEffect } from 'react'
import { cn } from '../../../lib/cn'
import { AlertIcon, CheckCircleIcon } from '../../../components/icons'
import styles from './Notice.module.css'

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
      className={cn(styles.notice, styles[tone])}
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
    >
      {tone === 'error' ? (
        <AlertIcon size={16} className={styles.icon} />
      ) : (
        <CheckCircleIcon size={16} className={styles.icon} />
      )}
      <span>{message}</span>
    </div>
  )
}
