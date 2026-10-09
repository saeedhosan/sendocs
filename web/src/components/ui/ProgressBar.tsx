import { cn } from '../../lib/cn'
import styles from './ProgressBar.module.css'

export type ProgressTone = 'waiting' | 'complete' | 'danger'

export type ProgressBarProps = {
  /** Completion from 0 to 100. */
  value: number
  tone?: ProgressTone
  /** Accessible name; the visible fraction is rendered by the caller. */
  label: string
  className?: string
}

export function ProgressBar({
  value,
  tone = 'waiting',
  label,
  className,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div
      className={cn(styles.track, className)}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
    >
      <span
        className={cn(styles.fill, styles[tone])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
