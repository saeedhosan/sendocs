import { cn } from '../../../lib/cn'
import styles from './AuthDivider.module.css'

export function AuthDivider({
  label,
  uppercase = false,
}: {
  label: string
  uppercase?: boolean
}) {
  return (
    <div className={styles.divider}>
      <span className={styles.line} aria-hidden="true" />
      <span className={cn(styles.label, uppercase && styles.uppercase)}>
        {label}
      </span>
    </div>
  )
}
