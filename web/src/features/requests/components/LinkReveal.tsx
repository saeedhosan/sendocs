import { useRef, useState } from 'react'
import { Button, Dialog } from '../../../components/ui'
import { CheckIcon, CopyIcon } from '../../../components/icons'
import type { MagicLink } from '../types'
import styles from './LinkReveal.module.css'

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
      ownerTheme="link-reveal"
      initialFocusRef={inputRef}
      footer={
        <Button
          variant="secondary"
          onClick={onClose}
          className={styles.doneButton}
        >
          Done
        </Button>
      }
    >
      <div className={styles.field}>
        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          readOnly
          value={link?.url ?? ''}
          onFocus={(event) => event.currentTarget.select()}
          aria-label="Client portal link"
        />
        <Button
          type="button"
          iconLeft={copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
          className={styles.copyButton}
          onClick={() => void copy()}
        >
          {copied ? 'Copied' : 'Copy link'}
        </Button>
      </div>
      <p className={styles.hint}>This link is shown only once.</p>
      {copyFailed ? (
        <p className={styles.hint} role="alert">
          Copy failed — select the link above and copy it manually.
        </p>
      ) : null}
      <p className="sr-only" aria-live="polite">
        {copied ? 'Copied to clipboard' : ''}
      </p>
    </Dialog>
  )
}
