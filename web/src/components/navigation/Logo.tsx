import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { LockIcon } from '../icons'
import styles from './Logo.module.css'

export type LogoProps = {
  /** Solid indigo tile behind the mark. The sign-in reference uses the plain form. */
  boxed?: boolean
  to?: string
  className?: string
}

export function Logo({ boxed = true, to = '/', className }: LogoProps) {
  const content = (
    <>
      <span className={cn(styles.mark, !boxed && styles.markPlain)}>
        <LockIcon size={boxed ? 18 : 20} />
      </span>
      <span className={styles.wordmark}>Sendocs</span>
    </>
  )

  return (
    <Link to={to} className={cn(styles.logo, className)} aria-label="Sendocs home">
      {content}
    </Link>
  )
}
