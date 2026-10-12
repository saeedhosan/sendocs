import { useEffect, useState, useCallback, useMemo } from 'react'
import { ThemeContext } from './ThemeContext'
import type { Theme } from './ThemeContext'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system'
    const stored = localStorage.getItem('theme') as Theme | null
    return stored || 'system'
  })

  const [mounted, setMounted] = useState(false)

  const getSystemTheme = useCallback((): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }, [])

  const resolvedTheme = useMemo(() => {
    if (!mounted) return 'light'
    return theme === 'system' ? getSystemTheme() : theme
  }, [mounted, theme, getSystemTheme])

  const applyTheme = useCallback((t: 'light' | 'dark') => {
    const root = document.documentElement
    if (t === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [])

  // Provide context immediately with initial values, update after mount
  const contextValue = useMemo(() => ({
    theme,
    resolvedTheme,
    setTheme,
  }), [theme, resolvedTheme, setTheme])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    applyTheme(resolvedTheme)
    localStorage.setItem('theme', theme)
  }, [mounted, resolvedTheme, theme, applyTheme])

  useEffect(() => {
    if (!mounted || theme !== 'system') return
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      applyTheme(getSystemTheme())
    }
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [mounted, theme, getSystemTheme, applyTheme])

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}