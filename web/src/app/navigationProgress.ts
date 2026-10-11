import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import './navigationProgress.css'

NProgress.configure({
  showSpinner: false,
  minimum: 0.08,
  speed: 180,
  trickleSpeed: 200,
})

// Only show the bar once a navigation has taken at least this long, so quick
// navigations don't produce a distracting flash.
const SHOW_DELAY_MS = 120
// Once visible, keep the bar on screen at least this long so it never blips.
const MIN_VISIBLE_MS = 250

let showTimer: number | undefined
let hideTimer: number | undefined
let visible = false
let shownAt = 0

/** Signal that a navigation has begun. */
export function startNavigationProgress() {
  if (hideTimer !== undefined) {
    clearTimeout(hideTimer)
    hideTimer = undefined
  }
  if (visible || showTimer !== undefined) return

  showTimer = window.setTimeout(() => {
    showTimer = undefined
    visible = true
    shownAt = performance.now()
    NProgress.start()
  }, SHOW_DELAY_MS)
}

/** Signal that the current navigation has settled. */
export function finishNavigationProgress() {
  if (showTimer !== undefined) {
    window.clearTimeout(showTimer)
    showTimer = undefined
    return
  }

  if (!visible) return

  const remaining = Math.max(0, MIN_VISIBLE_MS - (performance.now() - shownAt))
  if (hideTimer !== undefined) {
    window.clearTimeout(hideTimer)
  }
  hideTimer = window.setTimeout(() => {
    hideTimer = undefined
    NProgress.done()
  }, remaining)
}
