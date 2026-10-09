import { cn } from '../../../lib/cn'
import { CheckCircleIcon, RadioUncheckedIcon } from '../../../components/icons'
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
          {rule.met ? (
            <CheckCircleIcon size={15} className={styles.icon} />
          ) : (
            <RadioUncheckedIcon size={15} className={styles.icon} />
          )}
          <span>{rule.label}</span>
        </li>
      ))}
    </ul>
  )
}
