import { useRef } from 'react'
import { Button } from '../../../components/ui'
import { Dialog } from '../../../components/ui'
import type { ReactNode } from 'react'

export type ConfirmDialogProps = {
  open: boolean
  title: string
  description: ReactNode
  confirmLabel: string
  tone?: 'default' | 'danger'
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * The single confirmation dialog for destructive actions.
 *
 * Cancel receives initial focus and the buttons are not a form, so Enter does
 * not confirm by accident.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  tone = 'danger',
  onCancel,
  onConfirm,
  busy = false,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      tone={tone}
      initialFocusRef={cancelRef}
      footer={
        <>
          <Button
            ref={cancelRef}
            variant="secondary"
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={busy}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p>{description}</p>
    </Dialog>
  )
}
