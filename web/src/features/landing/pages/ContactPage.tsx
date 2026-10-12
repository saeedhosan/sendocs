import { Container } from '../../../components/ui'
import { app } from '../../../config/app'

/**
 * Minimal contact page matching the legal-document shell. It surfaces the
 * address the product already publishes in its legal documents rather than
 * inventing a support channel.
 */
export function ContactPage() {
  return (
    <Container as="article" className="!max-w-4xl px-6 py-10 bg-surface">
      <h1 className="mb-2 text-[1.875rem] font-bold leading-9 tracking-[-0.025em] text-ink">
        Contact
      </h1>

      <p className="mb-4 text-sm leading-[1.625] text-ink-body">
        {app.name} is a document collection service. If you have a question
        about your account, a document request, or how your data is handled,
        email us.
      </p>

      <div className="mt-6 pt-6 border-t border-border">
        <p className="text-sm text-ink-body">
          Reach our team at{' '}
          <a
            href={`mailto:${app.emails.contact}`}
            className="font-medium text-primary hover:underline"
          >
            {app.emails.contact}
          </a>
        </p>
      </div>
    </Container>
  )
}