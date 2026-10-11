import { LinkIcon } from '../../../components/icons'

/**
 * The single dead-link screen.
 *
 * It deliberately shows no request title, item label, count, or link state:
 * an unknown, malformed, expired, revoked, or tampered link is indistinguishable.
 */
export function DeadLinkScreen() {
  return (
    <section className="w-full py-12 text-center">
      <div className="w-full max-w-md mx-auto space-y-4 p-8 border border-border-subtle rounded-[10px] bg-surface text-center">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-surface-sunken text-ink-secondary">
          <LinkIcon size={20} />
        </span>
        <div className="space-y-2">
          <h1 className="text-lg font-bold tracking-tight text-ink">
            This link is no longer active
          </h1>
          <p className="text-sm leading-relaxed text-ink-secondary">
            The document upload link you accessed is invalid, expired, or has
            been revoked by the sender.
          </p>
        </div>
        <div className="pt-2">
          <p className="border-t border-border-subtle pt-4 text-xs leading-normal text-ink-muted">
            If you still need to submit documents, please contact the person or
            organization who requested them to request a new secure upload link.
          </p>
        </div>
      </div>
    </section>
  )
}
