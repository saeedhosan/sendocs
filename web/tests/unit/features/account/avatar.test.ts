import { describe, expect, it } from 'vitest'
import { getBackgroundColor, getInitials } from '../../../../src/features/account/lib/avatar'

describe('getInitials', () => {
  it('uses the first and last initials', () => {
    expect(getInitials('Saeed Hosan')).toBe('SH')
  })

  it('supports a single-word name', () => {
    expect(getInitials('Saeed')).toBe('S')
  })

  it('handles extra whitespace and empty names', () => {
    expect(getInitials('  Alex   Morgan  ')).toBe('AM')
    expect(getInitials('   ')).toBe('?')
  })
})

describe('getBackgroundColor', () => {
  it('returns the same color for the same name', () => {
    expect(getBackgroundColor('Alex Morgan')).toBe(getBackgroundColor('Alex Morgan'))
  })

  it('returns a color for a different name', () => {
    expect(getBackgroundColor('Alex Morgan')).not.toBe('')
    expect(getBackgroundColor('Sam Lee')).not.toBe('')
  })
})
