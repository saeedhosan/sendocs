import { Link } from 'react-router-dom'

export function CtaSection() {
  return (
    <section className="flex flex-col items-start justify-between gap-6 p-6 bg-surface-muted border border-border rounded-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.02)] sm:flex-row sm:items-center sm:p-8">
      <div className="max-w-[32rem]">
        <h2 className="text-xl font-semibold tracking-tight text-ink sm:text-[1.375rem]">
          Ready to simplify document collection?
        </h2>
        <p className="text-sm text-marketing-text-secondary">
          Create a request, share one link, and keep track of the documents you
          receive.
        </p>
      </div>
      <div className="shrink-0">
        <Link
          to="/register"
          className="inline-flex items-center justify-center min-h-11 px-6 rounded-[10px] bg-primary text-on-primary text-[0.8125rem] font-medium shadow-sm transition-colors duration-150 hover:bg-primary-hover"
        >
          Get started
        </Link>
      </div>
    </section>
  )
}
