import { ItemRow } from './ItemRow'
import type { RequestItem } from '../types'

export type ItemListProps = {
  items: RequestItem[]
  onDeleteDocument: (item: RequestItem) => void
  onDownloadDocument: (item: RequestItem) => void
}

export function ItemList({
  items,
  onDeleteDocument,
  onDownloadDocument,
}: ItemListProps) {
  return (
    <ul className="overflow-hidden border border-border rounded-[10px] bg-surface list-none">
      {items.map((item) => (
        <ItemRow
          key={item.id}
          item={item}
          onDelete={onDeleteDocument}
          onDownload={onDownloadDocument}
        />
      ))}
    </ul>
  )
}
