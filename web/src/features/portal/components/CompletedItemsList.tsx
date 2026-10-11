import type { PortalItem } from '../types'

export type CompletedItemsListProps = {
  items: PortalItem[]
}

/** Read-only summary of every item once the request is complete. */
export function CompletedItemsList({ items }: CompletedItemsListProps) {
  return (
    <section
      aria-label="Completed files list"
      className="flex flex-col border border-border-subtle rounded-[10px] bg-surface overflow-hidden"
    >
      {items.map((item, index) => (
        <div
          key={item.id}
          className="flex items-center justify-between gap-4 p-4 border-t border-border-subtle first:border-t-0"
        >
          <span className="text-xs font-medium text-ink">
            {index + 1}. {item.label}
          </span>
          <span className="text-xs font-medium text-success-text">
            Uploaded
          </span>
        </div>
      ))}
    </section>
  )
}
