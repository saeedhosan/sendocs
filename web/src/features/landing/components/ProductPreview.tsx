import {
  CheckCircleIcon,
  ClockIcon,
  DownloadIcon,
} from '../../../components/icons'
import { cn } from '../../../lib/cn'
import styles from './ProductPreview.module.css'

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
    <div className={styles.window} aria-hidden="true">
      <div className={styles.titleBar}>
        <div className={styles.titleGroup}>
          <span className={styles.dot} />
          <span className={styles.title}>
            2024 Corporate Tax Return — Acme Corp
          </span>
        </div>
        <span className={styles.activeBadge}>Active</span>
      </div>

      <div className={styles.body}>
        <div className={styles.progress}>
          <div className={styles.progressMeta}>
            <span className={styles.progressLabel}>3 of 5 uploaded</span>
          </div>
          <div className={styles.track}>
            <div className={styles.fill} />
          </div>
        </div>

        <div className={styles.items}>
          {items.map((item) => (
            <div
              key={item.name}
              className={cn(styles.item, !item.uploaded && styles.itemWaiting)}
            >
              <div className={styles.itemMain}>
                {item.uploaded ? (
                  <CheckCircleIcon size={18} className={styles.iconDone} />
                ) : (
                  <ClockIcon size={18} className={styles.iconWaiting} />
                )}
                <div className={styles.itemText}>
                  <p className={styles.itemName}>{item.name}</p>
                  <p className={styles.itemMeta}>{item.meta}</p>
                </div>
              </div>

              {item.uploaded ? (
                <span className={styles.download}>
                  <DownloadIcon size={14} />
                  <span className={styles.downloadLabel}>Download</span>
                </span>
              ) : (
                <span className={styles.waitingBadge}>Waiting</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
