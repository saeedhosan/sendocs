import type { ComponentType } from 'react'
import {
  RuleIcon,
  DevicesIcon,
  KeyIcon,
  LockIcon,
  ShieldCheckIcon,
  ShieldPersonIcon,
  TableChartIcon,
  TrendingUpIcon,
} from '../../../components/icons'
import type { IconProps } from '../../../components/icons'
import styles from './FeatureGrid.module.css'

type Feature = {
  icon: ComponentType<IconProps>
  title: string
  body: string
}

const features: Feature[] = [
  {
    icon: ShieldPersonIcon,
    title: 'Authentication and access',
    body: 'Secure owner accounts to manage document requests.',
  },
  {
    icon: RuleIcon,
    title: 'Document requests',
    body: 'Request 1–10 specific documents from each client.',
  },
  {
    icon: KeyIcon,
    title: 'Secure magic links',
    body: 'Give clients time-limited access through a revocable link.',
  },
  {
    icon: TrendingUpIcon,
    title: 'Progress tracking',
    body: 'See which documents have arrived and which are still missing.',
  },
  {
    icon: TableChartIcon,
    title: 'Owner dashboard',
    body: 'Review requests, manage links, and download collected files.',
  },
  {
    icon: DevicesIcon,
    title: 'Client portal',
    body: 'Let clients upload documents without creating an account.',
  },
]

export function FeatureGrid() {
  return (
    <section className={styles.section}>
      <div className={styles.intro}>
        <h2 className={styles.heading}>Everything you need to collect documents.</h2>
        <p className={styles.subheading}>
          From creating a request to receiving private files, keep the document
          collection process in one place.
        </p>
      </div>

      <div className={styles.grid}>
        {features.map((feature) => {
          const FeatureIcon = feature.icon
          return (
            <article key={feature.title} className={styles.card}>
              <span className={styles.iconTile}>
                <FeatureIcon size={18} />
              </span>
              <h3 className={styles.cardTitle}>{feature.title}</h3>
              <p className={styles.cardBody}>{feature.body}</p>
            </article>
          )
        })}
      </div>

      <div className={styles.storageBanner}>
        <div className={styles.storageMain}>
          <span className={styles.storageIcon}>
            <LockIcon size={20} />
          </span>
          <div>
            <h3 className={styles.cardTitle}>Private file storage</h3>
            <p className={styles.cardBody}>
              Validate uploads and keep files private with controlled downloads.
            </p>
          </div>
        </div>
        <p className={styles.storageNote}>
          <ShieldCheckIcon size={15} className={styles.storageNoteIcon} />
          <span>Zero public buckets</span>
        </p>
      </div>
    </section>
  )
}
