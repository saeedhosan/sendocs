import { cloneElement, isValidElement, useId } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { FormError } from './FormError'
import styles from './FormField.module.css'

type FieldChildProps = {
  id?: string
  invalid?: boolean
  'aria-describedby'?: string
  'aria-invalid'?: boolean
}

export type FormFieldProps = {
  label: ReactNode
  id?: string
  required?: boolean
  error?: string
  hint?: ReactNode
  /** Rendered at the end of the label row, e.g. a "Forgot password?" link. */
  labelAction?: ReactNode
  className?: string
  children: ReactNode
}

/**
 * One label, one control, one error message, wired together.
 *
 * The single child is cloned to receive a matching `id`, `aria-describedby`,
 * and `aria-invalid`, so the association is never forgotten at the call site.
 */
export function FormField({
  label,
  id,
  required = false,
  error,
  hint,
  labelAction,
  className,
  children,
}: FormFieldProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const hintId = `${fieldId}-hint`
  const errorId = `${fieldId}-error`

  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') ||
    undefined

  let control = children

  if (isValidElement<FieldChildProps>(children)) {
    control = cloneElement(children as ReactElement<FieldChildProps>, {
      id: fieldId,
      'aria-describedby': describedBy,
      'aria-invalid': error ? true : undefined,
      invalid: error ? true : undefined,
    })
  }

  return (
    <div className={cn(styles.field, className)}>
      <div className={styles.labelRow}>
        <label className={styles.label} htmlFor={fieldId}>
          {label}
          {required ? (
            <span className={styles.required} aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
        {labelAction}
      </div>
      {control}
      {hint ? (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      ) : null}
      {error ? <FormError id={errorId}>{error}</FormError> : null}
    </div>
  )
}
