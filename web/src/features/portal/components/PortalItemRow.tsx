import { useRef } from 'react'
import type { ChangeEvent } from 'react'
import { Button, ProgressBar } from '../../../components/ui'
import { cn } from '../../../lib/cn'
import { ACCEPT_ATTRIBUTE, ACCEPTED_TYPES_LABEL } from '../precheck'
import type { ItemFailure } from '../useUploadQueue'
import type { PortalItem } from '../types'
import styles from './PortalItemRow.module.css'

export type PortalItemRowProps = {
  item: PortalItem
  /** Present only while a transfer for this item is in flight. */
  percent?: number
  /** Present only while this item waits for a transfer slot. */
  queued?: boolean
  failure?: ItemFailure
  onPick: (itemId: string, file: File) => void
  /** Lets the page focus the first failed item's action. */
  actionRef?: (node: HTMLButtonElement | null) => void
}

export function PortalItemRow({
  item,
  percent,
  queued = false,
  failure,
  onPick,
  actionRef,
}: PortalItemRowProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const uploaded = item.state === 'uploaded' && item.file !== null
  const uploading = percent !== undefined

  function openPicker() {
    inputRef.current?.click()
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (file) {
      onPick(item.id, file)
    }
  }

  return (
    <li className={styles.row}>
      <div className={styles.main}>
        {uploaded && item.file ? (
          <>
            <p className={styles.label}>{item.label}</p>
            <p className={styles.meta}>
              <span>Uploaded</span>
              <span aria-hidden="true">·</span>
              <span className={styles.filename}>{item.file.originalName}</span>
            </p>
          </>
        ) : uploading ? (
          <>
            <div className={styles.uploadingHeading}>
              <p className={styles.label}>{item.label}</p>
              <span className={styles.transferLabel}>
                Uploading · {percent}%
              </span>
            </div>
            <div className={styles.transfer}>
              <ProgressBar
                value={percent ?? 0}
                label={`Uploading ${item.label}`}
              />
            </div>
          </>
        ) : failure ? (
          <>
            <p className={styles.label}>{item.label}</p>
            <p className={styles.error} role="alert">
              Upload failed · {failure.message}
            </p>
          </>
        ) : queued ? (
          <>
            <p className={styles.label}>{item.label}</p>
            <p className={styles.waiting}>Waiting for a free slot…</p>
          </>
        ) : (
          <>
            <p className={styles.label}>{item.label}</p>
            <p className={styles.waiting}>
              Waiting for upload · Max 25 MB · {ACCEPTED_TYPES_LABEL}
            </p>
          </>
        )}
      </div>

      <div className={styles.action}>
        {uploaded ? (
          <span className={styles.done} role="status" aria-label="Upload complete">
            Uploaded
          </span>
        ) : uploading ? null : (
          <>
            <input
              ref={inputRef}
              className="sr-only"
              type="file"
              accept={ACCEPT_ATTRIBUTE}
              onChange={handleChange}
              aria-label={`Choose a file for ${item.label}`}
            />
            <Button
              ref={actionRef}
              className={cn(
                styles.uploadButton,
                failure && styles.uploadButtonFailure,
              )}
              variant={failure ? 'secondary' : 'primary'}
              size="sm"
              onClick={openPicker}
              disabled={queued}
              aria-label={`${failure ? 'Try again' : 'Upload'}: ${item.label}`}
            >
              {queued ? 'Queued' : failure ? 'Try again' : 'Upload'}
            </Button>
          </>
        )}
      </div>
    </li>
  )
}
