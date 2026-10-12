import { cn } from '../../../lib/cn'
import { evaluatePasswordStrength } from '../../../lib/password'

const barCount = 4

export function PasswordStrengthMeter({
  value,
  variant = 'full',
}: {
  value: string
  variant?: 'full' | 'inline'
}) {
  const { score, label } = evaluatePasswordStrength(value)

  const tone = score <= 1 ? 'bg-[#ef4444]' : score === 2 ? 'bg-[#f59e0b]' : 'bg-[#10b981]'

  if (variant === 'inline') {
    return (
      <span className="text-xs font-medium text-ink-muted">{label}</span>
    )
  }

  return (
    <div className="pt-2">
      <div className="flex items-center justify-between text-xs text-ink-muted">
        <span>Password strength</span>
        <span className="font-medium">{label}</span>
      </div>
      <div
        className="flex gap-1 p-0.5 bg-surface-sunken rounded-full overflow-hidden"
        aria-hidden="true"
      >
        {Array.from({ length: barCount }, (_, index) => (
          <span
            key={index}
            className={cn('flex-1 h-1.5 rounded-full transition-colors duration-300', index < score ? tone : 'bg-border')}
          />
        ))}
      </div>
    </div>
  )
}
