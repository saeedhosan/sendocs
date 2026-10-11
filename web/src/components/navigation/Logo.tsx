import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'
import styles from './Logo.module.css'

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
      <span className={styles.mark} aria-hidden="true">
        S
      </span>
      <span className={styles.wordmark}>Sendocs</span>
    </>
  )

  if (to === null) {
    return <span className={cn(styles.logo, className)}>{content}</span>
  }

  return (
    <Link to={to} className={cn(styles.logo, className)} aria-label="Sendocs">
      {content}
    </Link>
  )
}
