import { DescriptionIcon, LockIcon } from '../../../components/icons'
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
        <span className="inline-flex items-center gap-1.5 text-base font-semibold tracking-tight text-ink"><DescriptionIcon size={16} className="text-primary" />{app.name}</span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-border rounded-md bg-surface-muted font-mono text-xs text-ink-muted">
          <LockIcon size={14} />
          <span>End-to-End Private</span>
        </span>
      </Container>
    </header>
  )
}
