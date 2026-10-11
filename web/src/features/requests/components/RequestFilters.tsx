import { SearchIcon } from '../../../components/icons'
import { cn } from '../../../lib/cn'
import styles from './RequestFilters.module.css'

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
    <div className={styles.filters}>
      <div className={styles.chips}>
        {chips.map((chip) => (
          <button
            key={chip.value}
            type="button"
            className={cn(styles.chip, value === chip.value && styles.chipActive)}
            aria-pressed={value === chip.value}
            onClick={() => onChange(chip.value)}
          >
            {chip.dot ? (
              <span
                className={cn(
                  styles.dot,
                  chip.value === 'waiting' ? styles.dotWaiting : styles.dotComplete,
                )}
                aria-hidden="true"
              />
            ) : null}
            <span>{chip.label}</span>
            <span
              className={cn(
                styles.count,
                chip.value === 'waiting' && styles.countWaiting,
                chip.value === 'complete' && styles.countComplete,
              )}
            >
              {counts[chip.value]}
            </span>
          </button>
        ))}
      </div>

      <div className={styles.search}>
        <SearchIcon size={17} className={styles.searchIcon} />
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Search requests..."
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </div>
    </div>
  )
}
