import { describe, expect, it } from 'vitest'
import { ApiError } from '../../../../src/lib/api/client'
import { errorMessage } from '../../../../src/lib/api/errors'

describe('errorMessage', () => {
  it('appends the Retry-After wait to a rate-limited message', () => {
    const error = new ApiError('rate_limited', 'Too many requests.', 429, {}, 30)

    expect(errorMessage(error)).toBe('Too many requests. Try again in 30 seconds.')
  })

  it('uses the singular unit for a one-second wait', () => {
    const error = new ApiError('rate_limited', 'Too many requests.', 429, {}, 1)

    expect(errorMessage(error)).toBe('Too many requests. Try again in 1 second.')
  })

  it('leaves a rate-limited message without a wait unchanged', () => {
    const error = new ApiError('rate_limited', 'Too many requests.', 429)

    expect(errorMessage(error)).toBe('Too many requests.')
  })

  it('passes through other API errors', () => {
    const error = new ApiError('internal_error', 'Boom.', 500)

    expect(errorMessage(error)).toBe('Boom.')
  })

  it('falls back for a non-API error', () => {
    expect(errorMessage(new Error('nope'))).toBe('Something went wrong. Try again.')
  })
})
