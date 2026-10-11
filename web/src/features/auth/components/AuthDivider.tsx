import styles from './AuthDivider.module.css'

export function AuthDivider({
  label,
  variant = 'login',
}: {
  label: string
  variant?: 'login' | 'register'
}) {
  return (
    <div
      className={[styles.divider, variant === 'register' ? styles.register : '']
        .filter(Boolean)
        .join(' ')}
    >
      <span className={styles.line} aria-hidden="true" />
      <span className={styles.label}>{label}</span>
    </div>
  )
}
