import type { ReactNode } from 'react'
import { Container } from '../components/ui'
import { Menu } from '../components/navigation/Menu'
import { FOOTER_ITEMS } from '../components/navigation/menu-items'
import { PublicHeader } from './components/PublicHeader'
import { OwnerHeader } from './components/OwnerHeader'
import { useAuth } from '../app/providers/useAuth'
import { cn } from '../lib/cn'
import { app } from '../config/app'

const MAIN =
  '[view-transition-name:page-content] flex flex-1 flex-col items-center justify-center w-full px-4'
const CARD =
  'w-full max-w-md mx-auto p-8 bg-surface border border-border rounded-[10px] shadow-sm [&_input:not([type=checkbox]):not([type=radio])]:rounded-[10px] [&_button:not(.absolute)]:rounded-[10px]'
const FOOTER_INNER =
  'flex flex-wrap items-center justify-center gap-2 text-xs text-ink-muted text-center'
const FOOTER_RESET_INNER =
  'flex flex-col items-center justify-center gap-4 text-[0.8125rem] leading-[1.125rem] text-ink-body text-center sm:flex-row'
const FOOTER_RESET_LINK = 'transition-colors duration-150 hover:text-ink'
const CHANGE_FOOTER_INNER = 'text-center text-xs text-ink-muted'
const EXTRA_LINK = 'transition-colors duration-150'

export type FooterVariant =
  | 'default'
  | 'login'
  | 'forget'
  | 'change'
  | 'reset-password'

export type AuthLayoutProps = {
  children: ReactNode
  /** A single muted link at the top right, e.g. "Help" or "Back to account". */
  headerAction?: { label: string; to: string }
  /** Page-specific footer copy/order/layout when a reference differs. */
  footerVariant?: FooterVariant
  layoutVariant?: 'default' | 'login' | 'reset' | 'change'
}

const whiteFooters: FooterVariant[] = ['login', 'forget', 'change']

/**
 * The shared shell for every unauthenticated page: brand header, a centered
 * card, and the legal footer. It only lays out; pages own their content. The
 * signed-in settings pages reuse it, and get the dashboard header instead so
 * every authenticated surface shares one header.
 */
export function AuthLayout({
  children,
  headerAction,
  footerVariant = 'default',
  layoutVariant = 'default',
}: AuthLayoutProps) {
  const { status } = useAuth()
  const isAuthenticated = status === 'authenticated'
  const isReset = footerVariant === 'reset-password'
  const isChange = footerVariant === 'change'
  const footerItems = isReset ? [...FOOTER_ITEMS].reverse() : FOOTER_ITEMS
  const copyright = isReset
    ? `© 2025 ${app.name} Technologies Inc.`
    : `© 2025 ${app.name} Inc.`
  const linkClass =
    footerVariant === 'login'
      ? `${EXTRA_LINK} hover:text-ink-secondary`
      : `${EXTRA_LINK} hover:text-ink-emphasis`

  return (
    <div className="flex flex-col min-h-screen bg-canvas-muted">
      {isAuthenticated ? (
        <OwnerHeader />
      ) : (
        <PublicHeader mode="auth" authAction={headerAction} />
      )}

      <main className={cn(MAIN, layoutVariant === 'default' && 'py-6')}>
        <Container className="flex flex-1 items-center justify-center w-full">
          <div
            className={cn(
              CARD,
              layoutVariant === 'default' || layoutVariant === 'reset'
                ? 'my-12'
                : layoutVariant === 'change'
                  ? 'my-0'
                  : 'mt-0 mb-12',
            )}
          >
            {children}
          </div>
        </Container>
      </main>

      {isReset ? (
        <footer className="w-full py-6">
          <Container className={FOOTER_RESET_INNER}>
            <span>{copyright}</span>
            <div className="flex items-center gap-4">
              <Menu
                as="span"
                items={footerItems}
                separator="•"
                itemClassName={FOOTER_RESET_LINK}
                highlightActive={false}
              />
            </div>
          </Container>
        </footer>
      ) : isChange ? (
        <footer className="w-full border-t border-border bg-surface py-6">
          <Container className={CHANGE_FOOTER_INNER}>
            <p>
              © 2025 {app.name} Inc. ·{' '}
              <Menu
                as="span"
                className="inline"
                items={footerItems}
                separator=" · "
                itemClassName={linkClass}
                highlightActive={false}
              />
            </p>
          </Container>
        </footer>
      ) : (
        <footer
          className={cn(
            'w-full border-t border-border py-6',
            whiteFooters.includes(footerVariant) && 'bg-surface',
            whiteFooters.includes(footerVariant) && '[&>div]:max-sm:flex-col',
          )}
        >
          <Container className={FOOTER_INNER}>
            <span>{copyright}</span>
            <Menu
              as="span"
              className="inline-flex items-center gap-2"
              items={footerItems}
              separator="·"
              leadingSeparator
              itemClassName={linkClass}
              highlightActive={false}
              separatorClassName={
                whiteFooters.includes(footerVariant) ? 'max-sm:hidden' : undefined
              }
            />
          </Container>
        </footer>
      )}
    </div>
  )
}
