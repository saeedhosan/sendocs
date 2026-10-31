/** Human-readable file size using binary steps, as shown in the owner designs. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  )
  const value = bytes / 1024 ** exponent
  const rounded =
    exponent === 0 || value >= 10 ? Math.round(value) : Math.round(value * 10) / 10

  return `${rounded} ${units[exponent]}`
}

/** Relative recency for the "last activity" column. */
export function timeAgo(iso: string | null, now: number = Date.now()): string {
  if (!iso) {
    return '-'
  }

  const then = new Date(iso).getTime()

  if (Number.isNaN(then)) {
    return '-'
  }

  const seconds = Math.floor(Math.max(0, now - then) / 1000)

  if (seconds < 45) {
    return 'Just now'
  }

  const minutes = Math.floor(seconds / 60)

  if (minutes < 60) {
    return minutes <= 1 ? '1 minute ago' : `${minutes} minutes ago`
  }

  const hours = Math.floor(minutes / 60)

  if (hours < 24) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`
  }

  const days = Math.floor(hours / 24)

  if (days < 30) {
    return days === 1 ? 'Yesterday' : `${days} days ago`
  }

  return formatDate(iso)
}

export function formatDateTime(iso: string, locale = 'en-US'): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}

export function formatDate(iso: string, locale = 'en-US'): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
    new Date(iso),
  )
}
