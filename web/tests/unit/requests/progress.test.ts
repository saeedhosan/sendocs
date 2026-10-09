import { describe, expect, it } from 'vitest'
import {
  itemStateLabel,
  linkState,
  linkStateLabel,
  percent,
  progressLabel,
  statusLabel,
  statusTone,
} from '../../../src/features/requests/progress'

const liveLink = { revokedAt: null, expiresAt: '2099-01-01T00:00:00Z' }

describe('progress', () => {
  it('reads the fraction first', () => {
    expect(progressLabel(0, 5)).toBe('0 of 5 uploaded')
    expect(progressLabel(3, 5)).toBe('3 of 5 uploaded')
    expect(progressLabel(10, 10)).toBe('10 of 10 uploaded')
  })

  it('rounds percent once and never divides by zero', () => {
    expect(percent(1, 3)).toBe(33)
    expect(percent(2, 3)).toBe(67)
    expect(percent(4, 5)).toBe(80)
    expect(percent(0, 0)).toBe(0)
  })

  it('drives the status chip from upload counts only', () => {
    expect(statusLabel({ status: 'complete' })).toBe('Complete')
    expect(statusLabel({ status: 'waiting' })).toBe('Waiting')
    expect(statusTone({ status: 'complete' })).toBe('complete')
    expect(statusTone({ status: 'waiting' })).toBe('waiting')
  })

  it('keeps link state independent of upload progress', () => {
    expect(linkState(liveLink)).toBe('active')
    expect(
      linkState({ ...liveLink, revokedAt: '2020-01-01T00:00:00Z' }),
    ).toBe('revoked')
    expect(
      linkState({ revokedAt: null, expiresAt: '2000-01-01T00:00:00Z' }),
    ).toBe('expired')
  })

  it('labels link states', () => {
    expect(linkStateLabel('active')).toBe('Active')
    expect(linkStateLabel('revoked')).toBe('Revoked')
    expect(linkStateLabel('expired')).toBe('Expired')
  })

  it('labels item state', () => {
    expect(itemStateLabel({ state: 'uploaded' })).toBe('Uploaded')
    expect(itemStateLabel({ state: 'waiting' })).toBe('Waiting')
  })

  it('prefers revoked over an expired timestamp', () => {
    expect(
      linkState({ revokedAt: '2020-01-01T00:00:00Z', expiresAt: '2000-01-01T00:00:00Z' }),
    ).toBe('revoked')
  })
})

describe('status tone', () => {
  it('shows waiting for any incomplete upload', () => {
    expect(statusTone({ status: 'waiting' })).toBe('waiting')
  })
})
