import { cn } from '../../../lib/cn'
import styles from './PasswordRequirementsList.module.css'

export type PasswordRule = {
  id: string
  label: string
  met: boolean
}

export function PasswordRequirementsList({ rules }: { rules: PasswordRule[] }) {
  return (
    <ul className={styles.list}>
      {rules.map((rule) => (
        <li key={rule.id} className={cn(styles.rule, rule.met && styles.met)}>
          <span className={styles.indicator} aria-hidden="true" />
          <span>{rule.label}</span>
        </li>
      ))}
    </ul>
  )
}
