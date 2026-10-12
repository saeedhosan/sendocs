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
      tone="default"
      variant="centered"
      className="border-neutral-200 shadow-[0_4px_12px_rgba(18,17,19,0.08)]"
      initialFocusRef={cancelRef}
      footer={
        <>
          <Button
            ref={cancelRef}
            variant="secondary"
            size="sm"
            className="min-h-11 rounded-[10px] sm:h-8 sm:min-h-8 sm:px-3 sm:text-xs"
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            size="sm"
            className={
              tone === 'danger'
                ? 'min-h-11 rounded-[10px] sm:h-8 sm:min-h-8 sm:px-3 sm:text-xs !border-[#e11d48] !bg-[#e11d48] !text-white enabled:hover:!border-[#be123c] enabled:hover:!bg-[#be123c] enabled:hover:!text-white'
                : 'min-h-11 sm:h-8 sm:min-h-8 sm:px-3 sm:text-xs'
            }
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
