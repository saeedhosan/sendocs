import { LinkIcon } from '../../../components/icons'

/**
 * The single dead-link screen.
 *
 * It is rendered without the portal shell and deliberately shows no request
 * title, item label, count, or link state: an unknown, malformed, expired,
 * revoked, or tampered link is indistinguishable from every other.
 */
export function DeadLinkScreen() {
  return (
    <main className="flex flex-1 items-center justify-center w-full py-12 px-4">
      <div className="w-full max-w-104 py-7 px-6 border border-border rounded-md bg-surface text-center">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-surface-sunken text-ink-muted">
          <LinkIcon size={22} />
        </span>
        <h1 className="mt-3.5 text-lg font-semibold tracking-[-0.01em] text-ink">
          This link is no longer active
        </h1>
        <p className="mt-2 text-sm leading-normal text-ink-secondary">
          The document upload link you accessed is invalid, expired, or has been
          revoked by the sender.
        </p>
        <p className="mt-2 pt-4 border-t border-border-subtle text-[0.8125rem] leading-normal text-ink-muted">
          If you still need to submit documents, please contact the person or
          organization who requested them to request a new secure upload link.
        </p>
      </div>
    </main>
  )
}
