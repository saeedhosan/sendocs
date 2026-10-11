import { cn } from '../../../lib/cn'
import styles from './PasswordRequirementsList.module.css'

export type PasswordRule = {
  id: string
  label: string
  met: boolean
}

export function PasswordRequirementsList({
  rules,
  panel = false,
  title = 'Requirements',
}: {
  rules: PasswordRule[]
  panel?: boolean
  title?: string
}) {
  const list = (
    <ul className={cn(styles.list, panel && styles.panelList)}>
      {rules.map((rule) => (
        <li key={rule.id} className={cn(styles.rule, rule.met && styles.met)}>
          <span className={styles.indicator} aria-hidden="true" />
          <span>{rule.label}</span>
        </li>
      ))}
    </ul>
  )

  if (!panel) {
    return list
  }

  return (
    <div className={styles.panel}>
      <span className={styles.panelTitle}>{title}</span>
      {list}
    </div>
  )
}
