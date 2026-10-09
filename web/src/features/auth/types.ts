export type AuthUser = {
  id: string
  name: string
  email: string
  emailVerifiedAt: string | null
}

/** The payload returned by register, login, password reset, and session. */
export type SessionPayload = {
  user: AuthUser
  csrfToken: string
  expiresAt: string
}

export type LoginInput = {
  email: string
  password: string
}

export type RegisterInput = {
  name: string
  email: string
  password: string
}

export type ChangePasswordInput = {
  currentPassword: string
  password: string
}

export type ResetPasswordInput = {
  token: string
  password: string
}

export type DeleteAccountInput = {
  password: string
  confirm: string
}
