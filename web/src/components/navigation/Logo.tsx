import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { app } from '../../config/app'

const LOGO = 'inline-flex items-center gap-2.5 text-ink'
const MARK =
  'inline-flex items-center justify-center size-7 rounded-[8px] bg-primary text-on-primary text-sm font-semibold tracking-[-0.01em]'
const WORDMARK = 'text-[0.9375rem] font-semibold tracking-[-0.025em]'

export type LogoProps = {
  /** Where the mark links. Pass `null` for non-navigating surfaces. */
  to?: string | null
  className?: string
  variant?: 'brand' | 'owner'
}

/**
 * The one Sendocs logo: a rounded indigo tile with the "S" letter mark and the
 * wordmark. Used on every surface so the brand reads the same everywhere.
 */
export function Logo({ to = '/', className, variant = 'brand' }: LogoProps) {
  const content = (
    <>
      <span
        className={cn(
          'inline-flex items-center justify-center bg-primary text-on-primary',
          variant === 'owner'
            ? 'size-6 rounded-[6px] font-mono text-xs font-bold shadow-sm'
            : 'size-7 rounded-[8px] text-sm font-semibold tracking-[-0.01em]',
        )}
        aria-hidden="true"
      >
        S
      </span>
      <span
        className={cn(
          variant === 'owner'
            ? 'text-[0.9375rem] font-medium tracking-tight'
            : WORDMARK,
        )}
      >
        {app.name}
      </span>
    </>
  )

  if (to === null) {
    return <span className={cn(LOGO, className)}>{content}</span>
  }

  return (
    <Link to={to} className={cn(LOGO, className)} aria-label={app.name}>
      {content}
    </Link>
  )
}
