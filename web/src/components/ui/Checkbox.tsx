import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'
import styles from './Checkbox.module.css'

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: ReactNode
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox({ label, id, className, ...props }, ref) {
    const generatedId = useId()
    const inputId = id ?? generatedId

    return (
      <div className={cn(styles.row, className)}>
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          className={styles.checkbox}
          {...props}
        />
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
      </div>
    )
  },
)
