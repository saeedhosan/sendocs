import { cn } from '../../lib/cn'
import { SpinnerIcon } from '../icons'
import styles from './Spinner.module.css'

export type SpinnerProps = {
  size?: number
  label?: string
  className?: string
}

export function Spinner({ size = 20, label = 'Loading', className }: SpinnerProps) {
  return (
    <span role="status" aria-live="polite">
      <SpinnerIcon size={size} className={cn(styles.spinner, className)} />
      <span className="sr-only">{label}</span>
    </span>
  )
}
