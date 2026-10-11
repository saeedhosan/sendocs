import { Button } from '../../../components/ui'
import { formatBytes } from '../../../lib/format'
import type { RequestItem } from '../types'
import styles from './ItemRow.module.css'

export type ItemRowProps = {
  item: RequestItem
  onDelete: (item: RequestItem) => void
}

export function ItemRow({ item, onDelete }: ItemRowProps) {
  const file = item.document

  return (
    <li className={styles.row}>
      <div className={styles.main}>
        <p className={styles.label}>{item.label}</p>
        {file ? (
          <p className={styles.meta}>
            <span className={styles.filename}>{file.originalName}</span>
            <span aria-hidden="true">•</span>
            <span>{formatBytes(file.sizeBytes)}</span>
          </p>
        ) : (
          <p className={styles.waiting}>Waiting</p>
        )}
      </div>
      {file ? (
        <div className={styles.actions}>
          {file.downloadUrl ? (
            <a
              className={styles.download}
              href={file.downloadUrl}
              download={file.originalName}
            >
              <span>Download</span>
            </a>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            className={styles.deleteButton}
            onClick={() => onDelete(item)}
          >
            Delete
          </Button>
        </div>
      ) : null}
    </li>
  )
}
