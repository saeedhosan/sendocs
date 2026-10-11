import { Container } from '../../../components/ui'
import { app } from '../../../config/app'

/**
 * Minimal contact page. It surfaces the address the product already publishes
 * in its legal documents rather than inventing a support channel.
 */
export function ContactPage() {
  return (
    <Container as="section" className="pt-10 pb-16 bg-surface">
      <h1 className="text-[1.875rem] font-semibold tracking-[-0.025em] text-ink">
        Contact
      </h1>

      <p className="max-w-[40rem] mt-2 text-sm leading-[1.625] text-ink-secondary">
        {app.name} is a document collection service. If you have a question about
        your account, a document request, or how your data is handled, email us.
      </p>

      <a
        href={`mailto:${app.emails.contact}`}
        className="inline-flex items-center min-h-10 mt-6 px-4 border border-border rounded-md bg-surface-muted text-[0.9375rem] font-medium text-primary transition-colors duration-150 hover:border-primary hover:underline"
      >
        {app.emails.contact}
      </a>
    </Container>
  )
}
