import { Link } from 'react-router-dom'
import { Container } from '../../../components/ui'
import { app } from '../../../config/app'

export function PortalFooter() {
  return (
    <footer className="mt-8 border-t border-border-subtle py-6 text-center text-xs text-ink-muted sm:mt-12 sm:py-8 sm:text-sm">
      <Container className="flex flex-wrap items-center justify-center gap-1.5">
        <span>© 2026 {app.name}</span>
        <span className="text-border-strong" aria-hidden="true">
          ·
        </span>
        <Link to="/terms" className="transition-colors duration-150 hover:text-ink-secondary">
          Terms
        </Link>
        <span className="text-border-strong" aria-hidden="true">
          ·
        </span>
        <Link to="/privacy" className="transition-colors duration-150 hover:text-ink-secondary">
          Privacy
        </Link>
      </Container>
    </footer>
  )
}