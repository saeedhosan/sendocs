import { Link } from 'react-router-dom'
import { Container } from '../../components/ui'
import { app } from '../../config/app'
import { cn } from '../../lib/cn'

export type OwnerFooterVariant = 'default' | 'detail'

export function OwnerFooter({ variant = 'default' }: { variant?: OwnerFooterVariant }) {
  const isDetail = variant === 'detail'

  return (
    <footer className={cn('border-t bg-surface py-4', isDetail ? 'border-neutral-200' : 'border-border-subtle')}>
      <Container
        className={cn(
          'px-4 sm:px-6 flex items-center justify-between gap-4 text-xs',
          isDetail ? 'text-neutral-500 !max-w-4xl' : 'text-ink-secondary !max-w-2xl',
        )}
      >
        <span>{app.name}</span>
        {isDetail ? (
          <div className="flex items-center gap-4">
            <Link to="/contact" className="transition-colors hover:text-neutral-900">Help</Link>
            <Link to="/privacy" className="transition-colors hover:text-neutral-900">Privacy</Link>
          </div>
        ) : (
          <span>Direct client document intake</span>
        )}
      </Container>
    </footer>
  )
}
