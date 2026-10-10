import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { authApi } from '../../features/auth/api'
import type {
  AuthUser,
  ChangePasswordInput,
  DeleteAccountInput,
  LoginInput,
  RegisterInput,
  SessionPayload,
} from '../../features/auth/types'
import { clearCsrfToken, setCsrfToken } from '../../lib/api/csrf'
import { setSessionInvalidHandler } from '../../lib/api/client'
import { AuthContext } from './auth-context'
import type { AuthContextValue, AuthStatus } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)

  const setSession = useCallback((payload: SessionPayload) => {
    setCsrfToken(payload.csrfToken)
    setUser(payload.user)
    setExpiresAt(payload.expiresAt)
    setStatus('authenticated')
  }, [])

  const clearSession = useCallback(() => {
    clearCsrfToken()
    setUser(null)
    setExpiresAt(null)
    setStatus('unauthenticated')
  }, [])

  // Any request that reports the session is gone (401 unauthenticated, or a
  // CSRF refresh that fails twice) drops the session so guards return to sign in.
  useEffect(() => {
    setSessionInvalidHandler(clearSession)

    return () => setSessionInvalidHandler(null)
  }, [clearSession])

  // Resolve the session once on boot, per docs/frontend.md.
  useEffect(() => {
    const controller = new AbortController()
    let active = true

    authApi
      .session(controller.signal)
      .then((payload) => {
        if (active) {
          setSession(payload)
        }
      })
      .catch((error: unknown) => {
        if (
          error instanceof DOMException &&
          error.name === 'AbortError'
        ) {
          return
        }

        if (active) {
          clearSession()
        }
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [setSession, clearSession])

  const login = useCallback(
    async (input: LoginInput) => {
      const payload = await authApi.login(input)
      setSession(payload)
    },
    [setSession],
  )

  const register = useCallback(
    async (input: RegisterInput) => {
      const payload = await authApi.register(input)
      setSession(payload)
    },
    [setSession],
  )

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // The local session is dropped regardless of the server's answer.
    }

    clearSession()
  }, [clearSession])

  const changePassword = useCallback(async (input: ChangePasswordInput) => {
    await authApi.changePassword(input)
  }, [])

  const deleteAccount = useCallback(
    async (input: DeleteAccountInput) => {
      await authApi.deleteAccount(input)
      clearSession()
    },
    [clearSession],
  )

  const refresh = useCallback(async () => {
    const payload = await authApi.session()
    setSession(payload)
  }, [setSession])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      expiresAt,
      login,
      register,
      logout,
      changePassword,
      deleteAccount,
      refresh,
      setSession,
    }),
    [
      status,
      user,
      expiresAt,
      login,
      register,
      logout,
      changePassword,
      deleteAccount,
      refresh,
      setSession,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
