import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Button } from '../../../components/ui'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CloseIcon,
  PlusIcon,
} from '../../../components/icons'
import { ApiError } from '../../../lib/api/client'
import { errorMessage, validationErrors } from '../../../lib/api/errors'
import { cn } from '../../../lib/cn'
import {
  createRequestSchema,
  ITEM_LIMIT,
  requestFieldErrors,
  toCreateRequestInput,
} from '../schemas'
import type { CreateRequestInput } from '../types'
import styles from './NewRequestForm.module.css'

export type NewRequestFormProps = {
  onSubmit: (input: CreateRequestInput) => Promise<void>
  onCancel?: () => void
}

export function NewRequestForm({ onSubmit, onCancel }: NewRequestFormProps) {
  const [title, setTitle] = useState('2024 Corporate Tax Return — Acme Corp')
  const [labels, setLabels] = useState<string[]>([
    'Government-issued photo ID',
    'W-2 / 1099 Forms or Profit & Loss Statement',
    'Articles of Incorporation & Proof of Address',
  ])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)
  const itemRefs = useRef<Array<HTMLInputElement | null>>([])

  function focusFirstInvalid(next: Record<string, string>) {
    const keys = Object.keys(next)

    if (keys.length === 0) {
      return
    }

    const first = keys[0]

    if (first === 'title') {
      titleRef.current?.focus()
      return
    }

    const index = Number(first.split('.')[1])
    itemRefs.current[index]?.focus()
  }

  function updateLabel(index: number, value: string) {
    setLabels((current) =>
      current.map((label, position) => (position === index ? value : label)),
    )
  }

  function addRow() {
    setLabels((current) =>
      current.length >= ITEM_LIMIT ? current : [...current, ''],
    )
  }

  function removeRow(index: number) {
    setLabels((current) =>
      current.length <= 1
        ? current
        : current.filter((_, position) => position !== index),
    )
  }

  function move(index: number, direction: -1 | 1) {
    setLabels((current) => {
      const next = [...current]
      const target = index + direction

      if (target < 0 || target >= next.length) {
        return current
      }

      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)

    const parsed = createRequestSchema.safeParse({
      title,
      items: labels.map((label) => ({ label })),
    })

    if (!parsed.success) {
      const next = requestFieldErrors(parsed.error)
      setErrors(next)
      focusFirstInvalid(next)
      return
    }

    setErrors({})
    setBusy(true)

    try {
      await onSubmit(toCreateRequestInput(title, labels))
    } catch (error) {
      if (error instanceof ApiError && error.code === 'validation_failed') {
        const next = validationErrors(error)
        setErrors(next)
        focusFirstInvalid(next)
      } else {
        setFormError(errorMessage(error))
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {formError ? <Alert variant="error">{formError}</Alert> : null}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="request-title">
          Title
        </label>
        <input
          id="request-title"
          ref={titleRef}
          className={cn(styles.input, errors.title && styles.inputInvalid)}
          placeholder="e.g. 2024 Corporate Tax Return — Acme Corp"
          value={title}
          maxLength={200}
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? 'request-title-error' : undefined}
          onChange={(event) => setTitle(event.target.value)}
        />
        {errors.title ? (
          <p id="request-title-error" className={styles.error}>
            {errors.title}
          </p>
        ) : null}
      </div>

      <div className={styles.items}>
        <div className={styles.itemsHead}>
          <span className={styles.label}>Required documents</span>
          <span className={styles.counter}>
            {labels.length}/{ITEM_LIMIT}
          </span>
        </div>

        <ul className={styles.itemList}>
          {labels.map((label, index) => (
            <li key={index} className={styles.itemRow}>
              <span className={styles.itemNumber} aria-hidden="true">
                {index + 1}.
              </span>
              <div className={styles.itemField}>
                <input
                  ref={(node) => {
                    itemRefs.current[index] = node
                  }}
                  className={cn(
                    styles.input,
                    errors[`items.${index}.label`] && styles.inputInvalid,
                  )}
                  placeholder="e.g. Government-issued photo ID"
                  value={label}
                  maxLength={200}
                  aria-label={`Document ${index + 1}`}
                  aria-invalid={
                    errors[`items.${index}.label`] ? true : undefined
                  }
                  onChange={(event) => updateLabel(index, event.target.value)}
                />
                {errors[`items.${index}.label`] ? (
                  <p className={styles.error}>
                    {errors[`items.${index}.label`]}
                  </p>
                ) : null}
              </div>
              <div className={styles.itemControls}>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={`Move document ${index + 1} up`}
                >
                  <ArrowUpIcon size={18} />
                </button>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => move(index, 1)}
                  disabled={index === labels.length - 1}
                  aria-label={`Move document ${index + 1} down`}
                >
                  <ArrowDownIcon size={18} />
                </button>
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => removeRow(index)}
                  disabled={labels.length <= 1}
                  aria-label={`Remove document ${index + 1}`}
                >
                  <CloseIcon size={18} />
                </button>
              </div>
            </li>
          ))}
        </ul>

        {errors.items ? <p className={styles.error}>{errors.items}</p> : null}

        {labels.length < ITEM_LIMIT ? (
          <button type="button" className={styles.addButton} onClick={addRow}>
            <PlusIcon size={18} />
            <span>Add item</span>
          </button>
        ) : null}
      </div>

      <div className={styles.actions}>
        {onCancel ? (
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
        ) : (
          <Link to="/dashboard" className={styles.cancel}>
            Cancel
          </Link>
        )}
        <Button
          type="submit"
          loading={busy}
          className={styles.submitButton}
        >
          Create request
        </Button>
      </div>
    </form>
  )
}
