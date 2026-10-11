import type { PortalItem } from '../types'
import styles from './CompletedItemsList.module.css'

export type CompletedItemsListProps = {
  items: PortalItem[]
}

/** Read-only summary of every item once the request is complete. */
export function CompletedItemsList({ items }: CompletedItemsListProps) {
  return (
    <section aria-label="Completed files list" className={styles.list}>
      {items.map((item, index) => (
        <div key={item.id} className={styles.row}>
          <span className={styles.label}>
            {index + 1}. {item.label}
          </span>
          <span className={styles.status}>Uploaded</span>
        </div>
      ))}
    </section>
  )
}
