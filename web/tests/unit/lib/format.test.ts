import { describe, expect, it } from 'vitest'
import { formatBytes, timeAgo } from '../../../src/lib/format'

describe('formatBytes', () => {
  it('formats zero and negatives as an empty size', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(-10)).toBe('0 B')
    expect(formatBytes(Number.NaN)).toBe('0 B')
  })

  it('steps through binary units', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(840 * 1024)).toBe('840 KB')
    expect(formatBytes(3.4 * 1024 * 1024)).toBe('3.4 MB')
  })
})

describe('timeAgo', () => {
  const now = new Date('2026-06-01T12:00:00Z').getTime()

  it('returns a dash for missing or invalid input', () => {
    expect(timeAgo(null, now)).toBe('—')
    expect(timeAgo('not-a-date', now)).toBe('—')
  })

  it('describes minutes, hours and days', () => {
    expect(timeAgo(new Date(now - 5 * 60_000).toISOString(), now)).toBe(
      '5 minutes ago',
    )
    expect(timeAgo(new Date(now - 3 * 3_600_000).toISOString(), now)).toBe(
      '3 hours ago',
    )
    expect(timeAgo(new Date(now - 2 * 86_400_000).toISOString(), now)).toBe(
      '2 days ago',
    )
  })

  it('falls back to an absolute date past a month', () => {
    const old = new Date(now - 40 * 86_400_000).toISOString()
    expect(timeAgo(old, now)).not.toContain('ago')
  })
})
