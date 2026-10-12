import { useRef, useState } from 'react'
import { Button, Dialog } from '../../../components/ui'
import { CheckIcon, CopyIcon } from '../../../components/icons'
import type { MagicLink } from '../types'

export type LinkRevealProps = {
  open: boolean
  link: MagicLink | null
  onClose: () => void
}

export function LinkReveal({ open, link, onClose }: LinkRevealProps) {
  const [copied, setCopied] = useState(false)
  const [copyFailed, setCopyFailed] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function copy() {
    if (!link) {
      return
    }

    try {
      await navigator.clipboard.writeText(link.url)
      setCopied(true)
      setCopyFailed(false)
    } catch {
      setCopyFailed(true)
      inputRef.current?.select()
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Your request is ready."
      description="Copy this link and send it to your client. The raw link is shown once only."
      variant="centered"
      className="border-border-subtle"
      initialFocusRef={inputRef}
      footer={
        <Button
          variant="secondary"
          onClick={onClose}
          className="min-h-11 h-11 px-6 rounded-[10px] !border-[#e2e8f0] bg-surface text-[#334155] !text-[13px] hover:bg-[#f8fafc] w-full sm:w-auto"
        >
          Done
        </Button>
      }
    >
      <div className="flex flex-col gap-2.5 mt-5 sm:flex-row sm:items-center">
        <input
          ref={inputRef}
          className="w-full min-w-0 min-h-11 h-11 px-3 border border-border-subtle rounded-[10px] bg-[#f4f4f6] text-ink font-mono text-[13px] truncate focus:outline-none focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-1"
          type="text"
          readOnly
          value={link?.url ?? ''}
          onFocus={(event) => event.currentTarget.select()}
          aria-label="Client portal link"
        />
        <Button
          type="button"
          iconLeft={copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
          onClick={() => void copy()}
          className="min-h-11 h-11 w-full rounded-[10px] !text-[13px] sm:w-auto"
        >
          {copied ? 'Copied' : 'Copy link'}
        </Button>
      </div>
      <p className="mt-2 text-xs text-ink-secondary">
        This link is shown only once.
      </p>
      {copyFailed ? (
        <p className="mt-2 text-xs text-ink-secondary" role="alert">
          Copy failed — select the link above and copy it manually.
        </p>
      ) : null}
      <p className="sr-only" aria-live="polite">
        {copied ? 'Copied to clipboard' : ''}
      </p>
    </Dialog>
  )
}
