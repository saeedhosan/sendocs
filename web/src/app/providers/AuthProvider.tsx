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
  UpdateAccountInput,
} from '../../features/auth/types'
import { clearCsrfToken, setCsrfToken } from '../../lib/api/csrf'
import { setSessionInvalidHandler } from '../../lib/api/client'
import { AuthContext } from './auth-context'
import type { AuthContextValue, AuthStatus } from './auth-context'

export function AuthProvider({
  children,
  initialSession,
}: {
  children: ReactNode
  /** Test-only bootstrap; production always resolves the session from the API. */
  initialSession?: SessionPayload
}) {
  const [providedInitialSession] = useState(initialSession)
  const [status, setStatus] = useState<AuthStatus>(
    providedInitialSession ? 'authenticated' : 'checking',
  )
  const [user, setUser] = useState<AuthUser | null>(
    providedInitialSession?.user ?? null,
  )
  const [expiresAt, setExpiresAt] = useState<string | null>(
    providedInitialSession?.expiresAt ?? null,
  )

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

  // Any request that reports the session is gone drops it and returns to sign in.
  useEffect(() => {
    setSessionInvalidHandler(clearSession)

    return () => setSessionInvalidHandler(null)
  }, [clearSession])

  // The cookie is the source of truth. Resolve it on every fresh app startup.
  useEffect(() => {
    if (providedInitialSession) {
      setCsrfToken(providedInitialSession.csrfToken)
      return
    }

    let cancelled = false

    authApi
      .session()
      .then((payload) => {
        if (!cancelled) {
          setSession(payload)
        }
      })
      .catch(() => {
        if (!cancelled) {
          clearCsrfToken()
          setStatus('unauthenticated')
        }
      })

    return () => {
      cancelled = true
    }
  }, [providedInitialSession, setSession])

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

  const updateAccount = useCallback(
    async (input: UpdateAccountInput) => {
      const payload = await authApi.updateAccount(input)
      // PATCH does not re-issue the transient OAuth image; retain it in memory.
      setSession({
        ...payload,
        user: { ...payload.user, pictureUrl: user?.pictureUrl ?? null },
      })
    },
    [setSession, user?.pictureUrl],
  )

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

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      expiresAt,
      login,
      register,
      logout,
      updateAccount,
      changePassword,
      deleteAccount,
      setSession,
    }),
    [
      status,
      user,
      expiresAt,
      login,
      register,
      logout,
      updateAccount,
      changePassword,
      deleteAccount,
      setSession,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
