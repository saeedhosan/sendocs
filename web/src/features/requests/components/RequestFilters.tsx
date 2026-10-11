import { SearchIcon } from '../../../components/icons'
import { cn } from '../../../lib/cn'

export type RequestFilter = 'all' | 'waiting' | 'complete'

export type RequestFiltersProps = {
  value: RequestFilter
  onChange: (value: RequestFilter) => void
  query: string
  onQueryChange: (value: string) => void
  counts: Record<RequestFilter, number>
}

const chips: Array<{ value: RequestFilter; label: string; dot?: boolean }> = [
  { value: 'all', label: 'All' },
  { value: 'waiting', label: 'Waiting', dot: true },
  { value: 'complete', label: 'Complete', dot: true },
]

/** Status filter chips and the search box above the request table. */
export function RequestFilters({
  value,
  onChange,
  query,
  onQueryChange,
  counts,
}: RequestFiltersProps) {
  return (
    <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
        {chips.map((chip) => (
          <button
            key={chip.value}
            type="button"
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-[8px] bg-surface text-xs font-normal leading-[1.125rem] whitespace-nowrap cursor-pointer transition-colors duration-150 hover:text-ink',
              value === chip.value
                ? 'border-border-strong text-ink font-medium shadow-2xs'
                : 'border-border-subtle text-ink-secondary',
            )}
            aria-pressed={value === chip.value}
            onClick={() => onChange(chip.value)}
          >
            {chip.dot ? (
              <span
                className={cn(
                  'size-1.5 rounded-full',
                  chip.value === 'waiting'
                    ? 'bg-[#f59e0b]'
                    : 'bg-[#10b981]',
                )}
                aria-hidden="true"
              />
            ) : null}
            <span>{chip.label}</span>
            <span
              className={cn(
                'px-1.5 py-px rounded-[4px] font-mono text-[0.6875rem] leading-4',
                chip.value === 'waiting'
                  ? 'bg-warning-surface text-warning-text'
                  : chip.value === 'complete'
                    ? 'bg-success-surface text-success-text'
                    : 'bg-surface-muted text-ink-secondary',
              )}
            >
              {counts[chip.value]}
            </span>
          </button>
        ))}
      </div>

      <div className="relative w-full md:w-64">
        <SearchIcon
          size={17}
          className="absolute top-1/2 left-2.5 -translate-y-1/2 text-ink-muted pointer-events-none"
        />
        <input
          type="search"
          className="w-full h-9 pr-3 pl-8 border border-border-subtle rounded-[8px] bg-surface text-ink text-xs placeholder:text-ink-muted focus:border-primary focus:outline-none focus:shadow-[0_0_0_1px_var(--color-primary)]"
          placeholder="Search requests..."
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </div>
    </div>
  )
}
