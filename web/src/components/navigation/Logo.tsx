import { Link } from 'react-router-dom'
import { app } from '../../config/app'
import { cn } from '../../lib/cn'

const LOGO = 'inline-flex items-center gap-2.5 text-ink'
const MARK_IMAGE = 'size-7 object-contain'
const MARK_IMAGE_OWNER = 'size-6 object-contain'
const WORDMARK_BRAND = 'text-[0.9375rem] font-semibold tracking-[-0.025em]'
const WORDMARK_OWNER = 'text-[0.9375rem] font-medium tracking-tight'

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
      className={isOwner ? MARK_IMAGE_OWNER : MARK_IMAGE}
    />
  ) : (
    <img
      src="/favicon.svg"
      alt=""
      aria-hidden="true"
      className={isOwner ? MARK_IMAGE_OWNER : MARK_IMAGE}
    />
  )
  const wordmarkClass = isOwner ? WORDMARK_OWNER : WORDMARK_BRAND
  const gapClass = isOwner ? 'gap-2' : undefined
  const content = (
    <>
      {mark}
      <span className={wordmarkClass}>{app.name}</span>
    </>
  )

  if (to === null) {
    return (
      <span className={cn(LOGO, gapClass, className)}>
        {content}
      </span>
    )
  }

  return (
    <Link
      to={to}
      className={cn(LOGO, gapClass, className)}
      aria-label={app.name}
    >
      {content}
    </Link>
  )
}