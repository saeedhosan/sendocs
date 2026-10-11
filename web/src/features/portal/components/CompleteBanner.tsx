import { CheckCircleIcon } from '../../../components/icons'

export type CompleteBannerProps = {
  uploaded: number
  total: number
}

/** Shown once every item is uploaded; there is nothing left to do. */
export function CompleteBanner({ uploaded, total }: CompleteBannerProps) {
  return (
    <section
      className="flex flex-col items-center gap-3 p-6 border border-border rounded-[10px] bg-surface text-center"
      aria-labelledby="portal-complete-title"
    >
      <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#d1fae5] text-[#047857]">
        <CheckCircleIcon size={22} />
      </span>
      <div className="flex flex-col items-center gap-1">
        <h1
          id="portal-complete-title"
          className="text-xl font-bold leading-7 tracking-tight text-ink"
        >
          All documents received
        </h1>
        <p className="max-w-112 text-sm leading-6 text-ink-secondary">
          You have uploaded all {total} requested documents. The request owner
          has been notified and can now review your files.
        </p>
      </div>
      <span className="mt-0 px-2.5 py-1 border border-success-border rounded-full bg-success-surface text-xs font-medium text-success-text">
        {uploaded} of {total} uploaded · Complete
      </span>
    </section>
  )
}
