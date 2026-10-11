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
}

/**
 * The one Sendocs logo: a rounded indigo tile with the "S" letter mark and the
 * wordmark. Used on every surface so the brand reads the same everywhere.
 */
export function Logo({ to = '/', className }: LogoProps) {
  const content = (
    <>
      <span className={MARK} aria-hidden="true">
        S
      </span>
      <span className={WORDMARK}>{app.name}</span>
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
