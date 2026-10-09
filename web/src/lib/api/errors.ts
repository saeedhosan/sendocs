import { ApiError } from './client'

/** A human-readable message for any thrown value. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }

  return 'Something went wrong. Try again.'
}

/** Field-level messages from a 422, keyed by field name. */
export function validationErrors(error: unknown): Record<string, string> {
  if (error instanceof ApiError && error.code === 'validation_failed') {
    return error.details
  }

  return {}
}
