import { Fragment } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Container } from '../../components/ui'
import { cn } from '../../lib/cn'

const INNER =
  'flex flex-wrap items-center justify-center gap-2 text-ink-muted text-center'
const INNER_DEFAULT = 'min-h-16 text-xs leading-4'
const INNER_LANDING = 'min-h-14 text-[0.8125rem] leading-5'
const LINK = 'transition-colors duration-150 hover:text-ink'
const LINK_ACTIVE = 'text-ink font-medium'

const links = [
  { label: 'Terms', to: '/terms' },
  { label: 'Privacy', to: '/privacy' },
  { label: 'Security', to: '/contact' },
]

const landingLinks = [
  { label: 'Terms', to: '/terms' },
  { label: 'Privacy', to: '/privacy' },
]

/** The minimal public footer shared by the landing and legal pages. */
export function PublicFooter() {
  const { pathname } = useLocation()
  const isLanding = pathname === '/'
  const visibleLinks = isLanding ? landingLinks : links

  return (
    <footer
      className={cn(
        'w-full mt-auto border-t border-border',
        isLanding ? 'bg-canvas-muted' : 'bg-surface',
      )}
    >
      <Container
        className={cn(INNER, isLanding ? INNER_LANDING : INNER_DEFAULT)}
      >
        <span>{isLanding ? '© 2026 Sendocs' : '© 2025 Sendocs Inc.'}</span>
        {visibleLinks.map((link) => (
          <Fragment key={link.to}>
            <span aria-hidden="true">·</span>
            <Link
              to={link.to}
              className={cn(
                LINK,
                !isLanding && pathname === link.to && LINK_ACTIVE,
              )}
            >
              {link.label}
            </Link>
          </Fragment>
        ))}
      </Container>
    </footer>
  )
}
