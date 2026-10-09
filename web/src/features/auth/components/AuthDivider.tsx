import styles from './AuthDivider.module.css'

export function AuthDivider({ label }: { label: string }) {
  return (
    <div className={styles.divider}>
      <span className={styles.line} aria-hidden="true" />
      <span className={styles.label}>{label}</span>
    </div>
  )
}
