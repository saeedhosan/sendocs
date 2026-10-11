import { Link } from 'react-router-dom'
import { ProductPreview } from './ProductPreview'

export function HeroSection() {
  return (
    <section className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
      <div className="flex flex-col gap-6 lg:col-span-6">
        <span className="inline-flex items-center self-start gap-2 px-2.5 py-1 border border-border rounded-md bg-surface-muted text-xs font-medium text-marketing-text-secondary">
          <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
          Document collection, made simple
        </span>

        <div className="flex flex-col gap-3.5">
          <h1 className="text-[2rem] leading-[1.18] font-semibold tracking-[-0.025em] text-ink sm:text-[2.375rem]">
            Collect client documents without the back-and-forth.
          </h1>
          <p className="text-[0.9375rem] leading-[1.625] text-marketing-text-secondary">
            Create a document request, share one secure link, and track what your
            clients upload. Clients can submit documents without creating an
            account.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Link
            to="/register"
            className="inline-flex items-center justify-center min-h-11 px-5 rounded-md bg-primary text-on-primary text-[0.8125rem] font-medium shadow-sm transition-colors duration-150 hover:bg-primary-hover"
          >
            Get started
          </Link>
        </div>
      </div>

      <div className="lg:col-span-6">
        <ProductPreview />
      </div>
    </section>
  )
}
