import { useEffect } from 'react'
import { useLocation, useNavigation } from 'react-router-dom'
import {
  finishNavigationProgress,
  startNavigationProgress,
} from './navigationProgress'

/** Whether a click will hand off to client-side routing. */
function isClientNavigation(event: MouseEvent) {
  if (event.defaultPrevented || event.button !== 0) return false
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return false
  }

  const anchor = (event.target as Element | null)?.closest?.('a[href]')
  if (!(anchor instanceof HTMLAnchorElement)) return false
  if (anchor.target && anchor.target !== '_self') return false
  if (anchor.hasAttribute('download')) return false

  const url = new URL(anchor.href, window.location.href)
  if (url.origin !== window.location.origin) return false
  if (
    url.pathname === window.location.pathname &&
    url.search === window.location.search
  ) {
    return false
  }

  return true
}

/**
 * Thin top progress bar. It starts from a capturing click listener (so no
 * wrapper component is needed around `<Link>`) and from the router's pending
 * state, then finishes when the location settles.
 */
export function RouteProgress() {
  const navigationState = useNavigation().state
  const locationKey = useLocation().key

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (isClientNavigation(event)) startNavigationProgress()
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  useEffect(() => {
    if (navigationState === 'idle') {
      finishNavigationProgress()
    } else {
      startNavigationProgress()
    }
  }, [navigationState])

  useEffect(() => {
    finishNavigationProgress()
  }, [locationKey])

  useEffect(
    () => () => {
      finishNavigationProgress()
    },
    [],
  )

  return null
}
