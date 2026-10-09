import { createContext } from 'react'
import type {
  AuthUser,
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
  SessionPayload,
} from '../../features/auth/types'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export type AuthContextValue = {
  status: AuthStatus
  user: AuthUser | null
  expiresAt: string | null
  login: (input: LoginInput) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => Promise<void>
  changePassword: (input: ChangePasswordInput) => Promise<void>
  refresh: () => Promise<void>
  setSession: (payload: SessionPayload) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
