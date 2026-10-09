import { ItemRow } from './ItemRow'
import type { RequestItem } from '../types'
import styles from './ItemList.module.css'

export type ItemListProps = {
  items: RequestItem[]
  onDeleteDocument: (item: RequestItem) => void
}

export function ItemList({ items, onDeleteDocument }: ItemListProps) {
  return (
    <ul className={styles.list}>
      {items.map((item) => (
        <ItemRow key={item.id} item={item} onDelete={onDeleteDocument} />
      ))}
    </ul>
  )
}
