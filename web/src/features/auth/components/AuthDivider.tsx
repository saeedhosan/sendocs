import { cn } from '../../../lib/cn'

export function AuthDivider({
  label,
  uppercase = false,
}: {
  label: string
  uppercase?: boolean
}) {
  return (
    <div className="relative flex items-center justify-center my-6">
      <span className="absolute inset-x-0 top-1/2 h-px bg-border" aria-hidden="true" />
      <span
        className={cn(
          'relative px-3 bg-surface text-xs',
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
