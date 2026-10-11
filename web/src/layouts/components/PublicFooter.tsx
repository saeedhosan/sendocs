import { Fragment } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Container } from '../../components/ui'
import { cn } from '../../lib/cn'
import { app } from '../../config/app'

const INNER =
  'flex flex-wrap items-center justify-center gap-2 text-ink-muted text-center'
const INNER_DEFAULT = 'min-h-16 text-xs leading-4'
const INNER_LANDING = 'min-h-14 text-[0.8125rem] leading-5'
const CONTAINER_LANDING = 'px-4 sm:px-6 min-[576px]:max-w-6xl min-[768px]:max-w-6xl min-[992px]:max-w-6xl min-[1200px]:max-w-6xl min-[1400px]:max-w-6xl'
const CONTAINER_DOCUMENT = 'px-6 min-[576px]:max-w-4xl min-[768px]:max-w-4xl min-[992px]:max-w-4xl min-[1200px]:max-w-4xl min-[1400px]:max-w-4xl'
const LINK = 'transition-colors duration-150 hover:text-ink'
const LINK_ACTIVE = 'text-ink-secondary font-medium'

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
        className={cn(
          INNER,
          isLanding
            ? cn(INNER_LANDING, CONTAINER_LANDING)
            : cn(INNER_DEFAULT, CONTAINER_DOCUMENT),
        )}
      >
        <span>{isLanding ? `© 2026 ${app.name}` : `© 2025 ${app.name} Inc.`}</span>
        {visibleLinks.map((link) => (
          <Fragment key={link.to}>
            <span aria-hidden="true">·</span>
            <Link
              to={link.to}
              className={cn(
                LINK,
                !isLanding && pathname === '/privacy' && pathname === link.to && LINK_ACTIVE,
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
