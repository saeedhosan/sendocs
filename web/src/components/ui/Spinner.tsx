import { cn } from '../../lib/cn'
import { SpinnerIcon } from '../icons'

export type SpinnerProps = {
  size?: number
  label?: string
  className?: string
}

export function Spinner({ size = 20, label = 'Loading', className }: SpinnerProps) {
  return (
    <span role="status" aria-live="polite">
      <SpinnerIcon
        size={size}
        className={cn(
          'animate-spin [animation-duration:0.7s] text-primary',
          className,
        )}
      />
      <span className="sr-only">{label}</span>
    </span>
  )
}
