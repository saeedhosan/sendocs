/*
 * The CSRF token lives in memory only, per docs/frontend.md.
 *
 * It is returned by register, login, and password reset,
 * and sent back as X-CSRF-Token on every state-changing request.
 */
let csrfToken: string | null = null

export function getCsrfToken(): string | null {
  return csrfToken
}

export function setCsrfToken(token: string | null): void {
  csrfToken = token
}

export function clearCsrfToken(): void {
  csrfToken = null
}
