import { describe, expect, it } from 'vitest'
import { message, retryable } from '../../../src/features/portal/errors'

const codes = [
  'file_too_large',
  'unsupported_type',
  'not_found',
  'duplicate_upload',
  'rate_limited',
  'internal_error',
  'network_error',
  'validation_failed',
  'invalid_link',
]

describe('portal upload errors', () => {
  it('gives every code its own sentence', () => {
    const messages = codes.map((code) => message(code))
    expect(new Set(messages).size).toBe(codes.length)
    expect(messages.every((text) => text.length > 0)).toBe(true)
  })

  it('names the accepted types for an unsupported file', () => {
    expect(message('unsupported_type')).toContain('PDF')
  })

  it('falls back to a generic sentence for an unknown code', () => {
    expect(message('mystery')).toBe('Something went wrong. Try again.')
  })

  it('only retries transient failures', () => {
    expect(retryable('rate_limited')).toBe(true)
    expect(retryable('internal_error')).toBe(true)
    expect(retryable('network_error')).toBe(true)

    expect(retryable('file_too_large')).toBe(false)
    expect(retryable('unsupported_type')).toBe(false)
    expect(retryable('not_found')).toBe(false)
    expect(retryable('duplicate_upload')).toBe(false)
    expect(retryable('validation_failed')).toBe(false)
    expect(retryable('invalid_link')).toBe(false)
  })
})
