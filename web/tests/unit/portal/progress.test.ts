import { describe, expect, it } from 'vitest'
import {
  progressLabel,
  remainingLabel,
  uploadPercent,
} from '../../../src/features/portal/progress'

describe('portal progress', () => {
  it('reads the fraction from the payload', () => {
    expect(progressLabel(3, 5)).toBe('3 of 5 uploaded')
    expect(progressLabel(5, 5)).toBe('5 of 5 uploaded')
  })

  it('pluralises the remaining count and handles none', () => {
    expect(remainingLabel(2)).toBe('2 items remaining')
    expect(remainingLabel(1)).toBe('1 item remaining')
    expect(remainingLabel(0)).toBe('Nothing left to upload')
  })

  it('rounds the bar percentage without dividing by zero', () => {
    expect(uploadPercent(1, 3)).toBe(33)
    expect(uploadPercent(3, 5)).toBe(60)
    expect(uploadPercent(0, 0)).toBe(0)
  })
})
