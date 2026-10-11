import { useEffect } from 'react'
import NProgress from 'nprogress'
import { useLocation, useNavigation } from 'react-router-dom'
import 'nprogress/nprogress.css'
import './RouteProgress.css'

NProgress.configure({
  showSpinner: false,
  minimum: 0.08,
  speed: 180,
  trickleSpeed: 200,
})

/**
 * Thin top progress bar tied to router navigations. A pending navigation is
 * reported while a lazily-loaded route chunk is fetched; the bar is also
 * started on link click and finished once the new location commits, so it
 * still appears for chunk-cached (instant) navigations.
 */
export function RouteProgress() {
  const navigationState = useNavigation().state
  const locationKey = useLocation().key

  useEffect(() => {
    if (navigationState === 'idle') {
      NProgress.done()
    } else {
      NProgress.start()
    }
  }, [navigationState])

  useEffect(() => {
    NProgress.done()
  }, [locationKey])

  useEffect(
    () => () => {
      NProgress.done()
    },
    [],
  )

  return null
}
