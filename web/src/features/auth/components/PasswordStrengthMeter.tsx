import { cn } from '../../../lib/cn'
import { evaluatePasswordStrength } from '../../../lib/password'
import styles from './PasswordStrengthMeter.module.css'

const barCount = 4

export function PasswordStrengthMeter({
  value,
  variant = 'full',
}: {
  value: string
  variant?: 'full' | 'inline'
}) {
  const { score, label } = evaluatePasswordStrength(value)

  const tone = score <= 1 ? styles.weak : score === 2 ? styles.standard : styles.strong

  if (variant === 'inline') {
    return <span className={styles.inlineLabel}>{label}</span>
  }

  return (
    <div className={styles.meter}>
      <div className={styles.row}>
        <span>Password strength</span>
        <span className={styles.label}>{label}</span>
      </div>
      <div className={styles.bars} aria-hidden="true">
        {Array.from({ length: barCount }, (_, index) => (
          <span
            key={index}
            className={cn(styles.bar, index < score && tone)}
          />
        ))}
      </div>
    </div>
  )
}
