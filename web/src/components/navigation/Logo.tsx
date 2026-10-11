import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { app } from '../../config/app'
import { LockIcon } from '../icons'

const LOGO = 'inline-flex items-center gap-2.5 text-ink'
const MARK_BRAND =
  'inline-flex items-center justify-center size-7 rounded-[8px] bg-primary text-on-primary text-sm font-semibold tracking-[-0.01em]'
const MARK_AUTH =
  'inline-flex items-center justify-center size-8 rounded-[10px] bg-primary text-on-primary'
const MARK_OWNER =
  'inline-flex items-center justify-center size-6 rounded-[6px] bg-primary text-on-primary font-mono text-xs font-bold shadow-sm'
const WORDMARK_BRAND = 'text-[0.9375rem] font-semibold tracking-[-0.025em]'
const WORDMARK_AUTH = 'text-lg font-semibold tracking-tight'
const WORDMARK_OWNER = 'text-[0.9375rem] font-medium tracking-tight'

export type LogoProps = {
  /** Where the mark links. Pass `null` for non-navigating surfaces. */
  to?: string | null
  className?: string
  variant?: 'brand' | 'auth' | 'owner'
}

/** The shared wordmark supports the distinct treatments used by each reference. */
export function Logo({ to = '/', className, variant = 'brand' }: LogoProps) {
  const content = (
    <>
      <span
        className={
          variant === 'auth'
            ? MARK_AUTH
            : variant === 'owner'
              ? MARK_OWNER
              : MARK_BRAND
        }
        aria-hidden="true"
      >
        {variant === 'auth' ? <LockIcon size={18} /> : 'S'}
      </span>
      <span
        className={
          variant === 'auth'
            ? WORDMARK_AUTH
            : variant === 'owner'
              ? WORDMARK_OWNER
              : WORDMARK_BRAND
        }
      >
        {app.name}
      </span>
    </>
  )

  if (to === null) {
    return (
      <span
        className={cn(LOGO, variant === 'owner' && 'gap-2', className)}
      >
        {content}
      </span>
    )
  }

  return (
    <Link
      to={to}
      className={cn(LOGO, variant === 'owner' && 'gap-2', className)}
      aria-label={app.name}
    >
      {content}
    </Link>
  )
}
