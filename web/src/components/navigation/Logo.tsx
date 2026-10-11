import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { app } from '../../config/app'
import { LockIcon } from '../icons'

const LOGO = 'inline-flex items-center gap-2.5 text-ink'
const MARK =
  'inline-flex items-center justify-center size-8 rounded-[10px] bg-primary text-on-primary'
const WORDMARK = 'text-lg font-semibold tracking-tight'

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
        <LockIcon size={18} />
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
