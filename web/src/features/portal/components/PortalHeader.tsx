import { LockIcon } from '../../../components/icons'
import { Logo } from '../../../components/navigation/Logo'
import { Container } from '../../../components/ui'

/**
 * The portal's minimal shell: the brand mark and a privacy note. No account, no
 * navigation, no owner identity — the client is anonymous by design.
 */
export function PortalHeader() {
  return (
    <header className="border-b border-border bg-surface">
      <Container className="!max-w-2xl px-4 sm:px-6 flex items-center justify-between gap-4 py-4">
        <Logo to={null} variant="portal" className="gap-1.5" />
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-border rounded-md bg-surface-muted font-mono text-xs text-ink-muted">
          <LockIcon size={14} />
          <span>End-to-End Private</span>
        </span>
      </Container>
    </header>
  )
}
