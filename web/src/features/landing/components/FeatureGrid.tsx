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
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 max-w-[36rem]">
        <h2 className="text-2xl font-semibold tracking-[-0.02em] text-ink sm:text-[1.625rem]">
          Everything you need to collect documents.
        </h2>
        <p className="text-sm leading-[1.625] text-marketing-text-secondary">
          From creating a request to receiving private files, keep the document
          collection process in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => {
          const FeatureIcon = feature.icon
          return (
            <article
              key={feature.title}
              className="flex flex-col gap-2 p-5 bg-surface border border-border rounded-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            >
              <span className="inline-flex items-center justify-center size-8 mb-1 border border-border rounded-[8px] bg-surface-muted text-primary">
                <FeatureIcon size={18} />
              </span>
              <h3 className="text-[0.9375rem] font-semibold text-ink">
                {feature.title}
              </h3>
              <p className="text-[0.8125rem] leading-[1.625] text-marketing-text-secondary">
                {feature.body}
              </p>
            </article>
          )
        })}
      </div>

      <div className="flex flex-col gap-4 p-5 bg-surface-muted border border-border rounded-[10px] sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-6">
        <div className="flex items-start gap-3.5 max-w-[42rem]">
          <span className="inline-flex shrink-0 items-center justify-center size-9 mt-0.5 border border-border rounded-[8px] bg-surface text-primary">
            <LockIcon size={20} />
          </span>
          <div>
            <h3 className="text-[0.9375rem] font-semibold text-ink">
              Private file storage
            </h3>
            <p className="text-[0.8125rem] leading-[1.625] text-marketing-text-secondary">
              Validate uploads and keep files private with controlled downloads.
            </p>
          </div>
        </div>
        <p className="inline-flex items-center gap-1.5 font-mono text-xs text-ink-muted">
          <ShieldCheckIcon size={15} className="text-marketing-success" />
          <span>Zero public buckets</span>
        </p>
      </div>
    </section>
  )
}
