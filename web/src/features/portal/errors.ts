import { ACCEPTED_TYPES_LABEL } from './precheck'

/*
 * Maps a failure code to a sentence the client can act on. Server text is
 * never shown; every sentence is authored here.
 */
const MESSAGES: Record<string, string> = {
  file_too_large: 'The file is larger than 25 MB',
  unsupported_type: `That file type is not accepted. Upload a ${ACCEPTED_TYPES_LABEL} file.`,
  not_found: 'This item is no longer part of the request.',
  duplicate_upload: 'A file has already been uploaded for this item.',
  rate_limited: 'Too many uploads right now. Please wait a moment and try again.',
  internal_error: 'Something went wrong. Try again.',
  network_error:
    'We could not reach the server. Check your connection and try again.',
  validation_failed: 'That file was rejected. Please choose another file.',
  invalid_link: 'This link is no longer active.',
}

/** A sentence the client can act on, with no server-supplied text. */
export function message(code: string): string {
  return MESSAGES[code] ?? 'Something went wrong. Try again.'
}

/** Whether re-sending the same file could succeed without the client changing it. */
export function retryable(code: string): boolean {
  return (
    code === 'rate_limited' || code === 'internal_error' || code === 'network_error'
  )
}
