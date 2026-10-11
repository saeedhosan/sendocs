import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Button } from '../../../components/ui'
import {
  CloseIcon,
  KeyboardArrowDownIcon,
  KeyboardArrowUpIcon,
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

const INPUT_CLASS =
  'w-full min-h-11 px-3 border rounded-[10px] bg-surface text-ink text-sm placeholder:text-ink-placeholder focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_var(--color-primary)]'

const ITEM_PLACEHOLDERS = [
  'e.g. Government-issued photo ID',
  'e.g. W-2 / 1099 Tax Documents',
  'e.g. Voided business check',
]

export type NewRequestFormProps = {
  onSubmit: (input: CreateRequestInput) => Promise<void>
  onCancel?: () => void
}

export function NewRequestForm({ onSubmit, onCancel }: NewRequestFormProps) {
  const [title, setTitle] = useState('')
  const [labels, setLabels] = useState<string[]>([''])
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
    <form
      className="flex flex-col gap-6 p-4 sm:p-6 border border-border rounded-[10px] bg-surface shadow-sm"
      onSubmit={handleSubmit}
      noValidate
    >
      {formError ? <Alert variant="error">{formError}</Alert> : null}

      <div className="flex flex-col gap-2">
        <label className="text-[0.8125rem] font-medium text-ink" htmlFor="request-title">
          Title
        </label>
        <input
          id="request-title"
          ref={titleRef}
          className={cn(
            INPUT_CLASS,
            errors.title ? 'border-danger' : 'border-border',
          )}
          placeholder="e.g. 2024 Corporate Tax Return — Acme Corp"
          value={title}
          maxLength={200}
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? 'request-title-error' : undefined}
          onChange={(event) => setTitle(event.target.value)}
        />
        {errors.title ? (
          <p id="request-title-error" className="text-xs text-danger-text">
            {errors.title}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[0.8125rem] font-medium text-ink">
            Required documents
          </span>
          <span className="font-mono text-xs text-ink-secondary">
            {labels.length}/{ITEM_LIMIT}
          </span>
        </div>

        <ul className="flex flex-col gap-2.5 sm:gap-2">
          {labels.map((label, index) => (
            <li key={index} className="flex items-center gap-2">
              <span
                className="w-6 flex-shrink-0 text-center font-mono text-[0.8125rem] text-ink-secondary"
                aria-hidden="true"
              >
                {index + 1}.
              </span>
              <div className="flex flex-1 min-w-0 flex-col gap-1">
                <input
                  ref={(node) => {
                    itemRefs.current[index] = node
                  }}
                  className={cn(
                    INPUT_CLASS,
                    errors[`items.${index}.label`]
                      ? 'border-danger'
                      : 'border-border',
                  )}
                  placeholder={ITEM_PLACEHOLDERS[index] ?? 'e.g. Proof of address'}
                  value={label}
                  maxLength={200}
                  aria-label={`Document ${index + 1}`}
                  aria-invalid={
                    errors[`items.${index}.label`] ? true : undefined
                  }
                  onChange={(event) => updateLabel(index, event.target.value)}
                />
                {errors[`items.${index}.label`] ? (
                  <p className="text-xs text-danger-text">
                    {errors[`items.${index}.label`]}
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <button
                  type="button"
                  className="inline-flex items-center justify-center w-9 h-11 sm:w-8 sm:h-9 border-0 rounded-md bg-transparent text-ink-secondary cursor-pointer transition-colors duration-150 enabled:hover:bg-surface-muted enabled:hover:text-ink disabled:opacity-35 disabled:cursor-not-allowed"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  title="Move up"
                  aria-label={`Move document ${index + 1} up`}
                >
                  <KeyboardArrowUpIcon size={18} />
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center w-9 h-11 sm:w-8 sm:h-9 border-0 rounded-md bg-transparent text-ink-secondary cursor-pointer transition-colors duration-150 enabled:hover:bg-surface-muted enabled:hover:text-ink disabled:opacity-35 disabled:cursor-not-allowed"
                  onClick={() => move(index, 1)}
                  disabled={index === labels.length - 1}
                  title="Move down"
                  aria-label={`Move document ${index + 1} down`}
                >
                  <KeyboardArrowDownIcon size={18} />
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center w-11 h-11 border-0 rounded-md bg-transparent text-ink-secondary cursor-pointer transition-colors duration-150 enabled:hover:text-danger disabled:opacity-35 disabled:cursor-not-allowed"
                  onClick={() => removeRow(index)}
                  disabled={labels.length <= 1}
                  title="Remove"
                  aria-label={`Remove document ${index + 1}`}
                >
                  <CloseIcon size={18} />
                </button>
              </div>
            </li>
          ))}
        </ul>

        {errors.items ? (
          <p className="text-xs text-danger-text">{errors.items}</p>
        ) : null}

        {labels.length < ITEM_LIMIT ? (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 self-start min-h-11 mt-3 px-1 border-0 bg-transparent text-[0.8125rem] font-medium text-ink-secondary cursor-pointer hover:text-ink"
            onClick={addRow}
          >
            <PlusIcon size={18} />
            <span>Add item</span>
          </button>
        ) : null}
      </div>

      <div className="flex flex-col-reverse gap-3 pt-4 border-t border-border sm:flex-row sm:items-center sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
        {onCancel ? (
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
        ) : (
          <Link
            to="/dashboard"
            className="flex items-center justify-center min-h-11 text-[0.8125rem] text-ink-secondary hover:text-ink"
          >
            Cancel
          </Link>
        )}
        <Button
          type="submit"
          loading={busy}
          className="min-h-11"
        >
          Create request
        </Button>
      </div>
    </form>
  )
}
