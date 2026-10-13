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

const SESSION_STORAGE_KEY = 'sendocs.owner-session.v1'

function readStoredSession(): SessionPayload | null {
  try {
    const value = sessionStorage.getItem(SESSION_STORAGE_KEY)

    if (value === null) {
      return null
    }

    const session = JSON.parse(value) as SessionPayload

    if (
      typeof session.csrfToken !== 'string' ||
      typeof session.expiresAt !== 'string' ||
      Date.parse(session.expiresAt) <= Date.now() ||
      typeof session.user?.id !== 'string'
    ) {
      sessionStorage.removeItem(SESSION_STORAGE_KEY)
      return null
    }

    return session
  } catch {
    return null
  }
}

export function AuthProvider({
  children,
  initialSession,
}: {
  children: ReactNode
  initialSession?: SessionPayload
}) {
  const [restoredSession] = useState(() => initialSession ?? readStoredSession())
  const [status, setStatus] = useState<AuthStatus>(
    restoredSession ? 'authenticated' : 'checking',
  )
  const [user, setUser] = useState<AuthUser | null>(restoredSession?.user ?? null)
  const [expiresAt, setExpiresAt] = useState<string | null>(
    restoredSession?.expiresAt ?? null,
  )

  const setSession = useCallback((payload: SessionPayload) => {
    setCsrfToken(payload.csrfToken)
    setUser(payload.user)
    setExpiresAt(payload.expiresAt)
    setStatus('authenticated')
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload))
    } catch {
      // Authentication remains available for this page if storage is blocked.
    }
  }, [])

  const clearSession = useCallback(() => {
    clearCsrfToken()
    setUser(null)
    setExpiresAt(null)
    setStatus('unauthenticated')
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY)
    } catch {
      // The in-memory session is still cleared.
    }
  }, [])

  // Any request that reports the session is gone drops it and returns to sign in.
  useEffect(() => {
    setSessionInvalidHandler(clearSession)

    return () => setSessionInvalidHandler(null)
  }, [clearSession])

  useEffect(() => {
    if (restoredSession) {
      setCsrfToken(restoredSession.csrfToken)
    }
  }, [restoredSession])

  // Boot: if no stored session, try to restore from the server via cookie.
  useEffect(() => {
    if (restoredSession) {
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
          setStatus('unauthenticated')
        }
      })

    return () => {
      cancelled = true
    }
  }, [restoredSession, setSession, setStatus])

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
      setSession,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
