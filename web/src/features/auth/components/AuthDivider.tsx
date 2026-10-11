import { cn } from '../../../lib/cn'

export function AuthDivider({
  label,
  uppercase = false,
  compact = false,
}: {
  label: string
  uppercase?: boolean
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        'relative flex items-center justify-center my-6',
        compact && 'h-px',
      )}
    >
      <span
        className="absolute inset-x-0 top-1/2 h-px bg-border"
        aria-hidden="true"
      />
      <span
        className={cn(
          compact
            ? 'absolute px-3 bg-surface text-xs'
            : 'relative px-3 bg-surface text-xs',
          uppercase
            ? 'uppercase tracking-[0.05em] text-ink-placeholder'
            : 'text-ink-muted',
        )}
      >
        {label}
      </span>
    </div>
  )
}
