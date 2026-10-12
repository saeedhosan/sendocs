import { cn } from '../../../lib/cn'

export type PasswordRule = {
  id: string
  label: string
  met: boolean
}

export function PasswordRequirementsList({
  rules,
  panel = false,
  title = 'Requirements',
}: {
  rules: PasswordRule[]
  panel?: boolean
  title?: string
}) {
  const list = (
    <ul className={cn('flex flex-col gap-1 text-xs text-ink-muted', !panel && 'pt-1')}>
      {rules.map((rule) => (
        <li
          key={rule.id}
          className={cn('flex items-center gap-1.5', rule.met && 'text-success-text')}
        >
          <span
            className={cn(
              'shrink-0 rounded-full',
              panel
                ? cn(
                    'size-[0.9375rem] border',
                    rule.met ? 'border-success' : 'border-ink-placeholder',
                  )
                : cn('size-1.5', rule.met ? 'bg-success' : 'bg-ink-placeholder'),
            )}
            aria-hidden="true"
          />
          <span>{rule.label}</span>
        </li>
      ))}
    </ul>
  )

  if (!panel) {
    return list
  }

  return (
    <div className="flex h-[88.5px] flex-col gap-2 p-3 border border-border rounded-[10px] bg-surface-subtle">
      <span className="block text-[0.6875rem] font-semibold tracking-[0.05em] uppercase text-ink-muted">
        {title}
      </span>
      {list}
    </div>
  )
}
