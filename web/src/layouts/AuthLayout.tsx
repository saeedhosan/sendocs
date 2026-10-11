import type { ReactNode } from 'react'
import { PublicFooter } from './components/PublicFooter'
import { PublicHeader } from './components/PublicHeader'
import { cn } from '../lib/cn'

const MAIN =
  '[view-transition-name:page-content] flex flex-1 flex-col items-center justify-center w-full px-4'
const CARD =
  'w-full max-w-md mx-auto p-8 bg-surface border border-border rounded-[10px] shadow-sm [&_input:not([type=checkbox]):not([type=radio])]:rounded-[10px] [&_button:not(.absolute)]:rounded-[10px]'

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
  logoVariant?: 'auth' | 'auth-login' | 'auth-register'
  layoutVariant?: 'default' | 'login' | 'reset' | 'change'
}

/**
 * The shared shell for every unauthenticated page: brand header, a centered
 * card, and the legal footer. It only lays out; pages own their content.
 */
export function AuthLayout({
  children,
  headerAction,
  footerVariant = 'default',
  logoVariant = 'auth',
  layoutVariant = 'default',
}: AuthLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-canvas-muted">
      <PublicHeader mode="auth" authAction={headerAction} authLogoVariant={logoVariant} />

      <main className={cn(MAIN, layoutVariant === 'default' && 'py-6')}>
        <div
          className={cn(
            'flex flex-1 items-center justify-center w-full',
            layoutVariant === 'default' && 'px-4',
            layoutVariant === 'change' && 'max-w-md mt-0 mb-6 px-4 pt-6 sm:px-0',
          )}
        >
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
        </div>
      </main>

      <PublicFooter mode="auth" variant={footerVariant} />
    </div>
  )
}
