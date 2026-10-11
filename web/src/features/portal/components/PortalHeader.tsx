import { LockIcon } from '../../../components/icons'
import { app } from '../../../config/app'
import { Container } from '../../../components/ui'

/**
 * The portal's minimal shell: the brand mark and a privacy note. No account, no
 * navigation, no owner identity — the client is anonymous by design.
 */
export function PortalHeader() {
  return (
    <header className="border-b border-border bg-surface">
      <Container className="px-4 sm:px-6 min-[576px]:max-w-2xl min-[768px]:max-w-2xl min-[992px]:max-w-2xl min-[1200px]:max-w-2xl min-[1400px]:max-w-2xl flex items-center justify-between gap-4 py-4">
        <span className="inline-flex items-center gap-1.5 text-base font-semibold tracking-tight text-ink">
          <svg
            className="h-4 w-4 text-primary"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          {app.name}
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-border rounded-md bg-surface-subtle font-mono text-xs text-ink-muted">
          <LockIcon size={14} />
          <span>End-to-End Private</span>
        </span>
      </Container>
    </header>
  )
}
