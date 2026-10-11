import {
  CheckCircleIcon,
  PendingIcon,
  DownloadIcon,
} from '../../../components/icons'
import { cn } from '../../../lib/cn'

type PreviewItem = {
  name: string
  meta: string
  uploaded: boolean
}

const items: PreviewItem[] = [
  {
    name: '1. 2023 Form 1120-S Federal Return',
    meta: 'Uploaded · 2023_1120S.pdf (3.4 MB)',
    uploaded: true,
  },
  {
    name: '2. Year-End Balance Sheet & P&L',
    meta: 'Uploaded · Acme_Q4.xlsx (1.8 MB)',
    uploaded: true,
  },
  {
    name: '3. Articles of Incorporation',
    meta: 'Uploaded · Articles_State.pdf (840 KB)',
    uploaded: true,
  },
  {
    name: '4. State Tax Exemption Certificate',
    meta: 'Waiting on Acme Corp',
    uploaded: false,
  },
  {
    name: '5. Shareholder Ownership Schedule',
    meta: 'Waiting on Acme Corp',
    uploaded: false,
  },
]

/**
 * A static illustration of a request as it appears in the product. It mirrors
 * the reference mock and carries no real data, so it is hidden from assistive
 * technology and contains no focusable controls.
 */
export function ProductPreview() {
  return (
    <div
      className="overflow-hidden bg-surface border border-border rounded-[10px] shadow-sm"
      aria-hidden="true"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-surface-subtle border-b border-border-subtle">
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0 size-2.5 rounded-full bg-border-strong" />
          <span className="text-[14px] leading-[1.5] font-semibold text-ink truncate">
            2024 Corporate Tax Return — Acme Corp
          </span>
        </div>
        <span className="shrink-0 px-2 py-0.5 border border-marketing-success-border rounded-[4px] bg-marketing-success-surface text-[0.6875rem] leading-[1.5] font-medium text-marketing-success">
          Active
        </span>
      </div>

      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[12px] leading-[1.5] font-medium text-marketing-text-secondary">
              3 of 5 uploaded
            </span>
          </div>
          <div className="w-full h-1.5 overflow-hidden rounded-full bg-surface-sunken">
            <div className="w-[60%] h-full rounded-full bg-primary transition-[width] duration-300" />
          </div>
        </div>

        <div className="flex flex-col overflow-hidden border border-border rounded-[10px]">
          {items.map((item, index) => (
            <div
              key={item.name}
              className={cn(
                'flex items-center justify-between gap-3 p-3',
                item.uploaded ? 'bg-surface' : 'bg-surface-subtle',
                index > 0 && 'border-t border-border',
              )}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                {item.uploaded ? (
                  <CheckCircleIcon
                    size={18}
                    className="shrink-0 mt-0.5 text-marketing-success"
                  />
                ) : (
                  <PendingIcon
                    size={18}
                    className="shrink-0 mt-0.5 text-ink-muted"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-[0.8125rem] leading-[1.5] font-medium text-ink truncate">
                    {item.name}
                  </p>
                  <p className="font-mono text-[0.6875rem] leading-[1.5] text-ink-muted truncate">
                    {item.meta}
                  </p>
                </div>
              </div>

              {item.uploaded ? (
                <span className="inline-flex shrink-0 items-center gap-1 px-2.5 py-1 border border-border rounded-[6px] text-xs font-medium text-marketing-text-secondary">
                  <DownloadIcon size={14} />
                  <span className="hidden sm:inline">Download</span>
                </span>
              ) : (
                <span className="shrink-0 px-2 py-0.5 border border-border rounded-[4px] bg-surface-sunken text-[0.6875rem] leading-[1.5] font-medium text-marketing-text-secondary">
                  Waiting
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
