import { apiRequest } from '../../lib/api/client'
import type {
  ChangePasswordInput,
  DeleteAccountInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  SessionPayload,
} from './types'

export type VerifyEmailResult = {
  emailVerifiedAt: string
}

/**
 * Thin wrappers over the documented owner-auth operations.
 * No business rules live here; only the HTTP shape.
 */
export const authApi = {
  register(input: RegisterInput): Promise<SessionPayload> {
    return apiRequest<SessionPayload>('/auth/register', {
      method: 'POST',
      body: input,
    })
  },

  login(input: LoginInput): Promise<SessionPayload> {
    return apiRequest<SessionPayload>('/auth/login', {
      method: 'POST',
      body: input,
    })
  },

  logout(): Promise<void> {
    return apiRequest<void>('/auth/logout', { method: 'POST' })
  },

  session(signal?: AbortSignal): Promise<SessionPayload> {
    return apiRequest<SessionPayload>('/auth/session', { signal })
  },

  forgotPassword(email: string): Promise<void> {
    return apiRequest<void>('/auth/password/forgot', {
      method: 'POST',
      body: { email },
    })
  },

  resetPassword(input: ResetPasswordInput): Promise<SessionPayload> {
    return apiRequest<SessionPayload>('/auth/password/reset', {
      method: 'POST',
      body: input,
    })
  },

  changePassword(input: ChangePasswordInput): Promise<void> {
    return apiRequest<void>('/auth/password/change', {
      method: 'POST',
      body: input,
    })
  },

  verifyEmail(token: string, signal?: AbortSignal): Promise<VerifyEmailResult> {
    return apiRequest<VerifyEmailResult>(
      `/auth/email/verify?token=${encodeURIComponent(token)}`,
      { signal },
    )
  },

  resendVerification(): Promise<void> {
    return apiRequest<void>('/auth/email/resend', { method: 'POST' })
  },

  googleAuthUrl(): Promise<{ authUrl: string }> {
    return apiRequest<{ authUrl: string }>('/auth/oauth/google')
  },

  deleteAccount(input: DeleteAccountInput): Promise<void> {
    return apiRequest<void>('/auth/account', {
      method: 'DELETE',
      body: input,
    })
  },
}
