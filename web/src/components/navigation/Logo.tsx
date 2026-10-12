import { Link } from 'react-router-dom'
import { app } from '../../config/app'
import { cn } from '../../lib/cn'

export type LogoProps = {
  /** Where the mark links. Pass `null` for non-navigating surfaces. */
  to?: string | null
  className?: string
  variant?: 'brand' | 'owner'
  /**
   * Optional mark image. When set it replaces the default brand tile/letter,
   * e.g. once a real logo asset exists.
   */
  imageSrc?: string
  imageAlt?: string
}

/** The single shared logo: the brand mark and wordmark used across every surface. */
export function Logo({
  to = '/',
  className,
  variant = 'brand',
  imageSrc,
  imageAlt,
}: LogoProps) {
  const isOwner = variant === 'owner'
  const mark = imageSrc ? (
    <img
      src={imageSrc}
      alt={imageAlt ?? ''}
      aria-hidden={!imageAlt}
      className={isOwner ? 'size-6 object-contain' : 'size-7 object-contain'}
    />
  ) : (
    <img
      src="/favicon.svg"
      alt=""
      aria-hidden="true"
      className={isOwner ? 'size-6 object-contain' : 'size-7 object-contain'}
    />
  )
  const wordmarkClass = isOwner
    ? 'text-[0.9375rem] font-medium tracking-tight'
    : 'text-[0.9375rem] font-semibold tracking-[-0.025em]'
  const gapClass = isOwner ? 'gap-2' : undefined
  const content = (
    <>
      {mark}
      <span className={wordmarkClass}>{app.name}</span>
    </>
  )

  if (to === null) {
    return (
      <span className={cn('inline-flex items-center gap-2.5 text-ink', gapClass, className)}>
        {content}
      </span>
    )
  }

  return (
    <Link
      to={to}
      className={cn('inline-flex items-center gap-2.5 text-ink', gapClass, className)}
      aria-label={app.name}
    >
      {content}
    </Link>
  )
}