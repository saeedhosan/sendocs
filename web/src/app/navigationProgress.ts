import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import './navigationProgress.css'

NProgress.configure({
  showSpinner: false,
  minimum: 0.08,
  speed: 200,
  trickleSpeed: 200,
})

// Keep the bar on screen at least this long once shown, so even instant
// navigations give a visible, non-jarring sweep.
const MIN_VISIBLE_MS = 320

let hideTimer: number | undefined
let visible = false
let shownAt = 0

/** Signal that a navigation has begun. */
export function startNavigationProgress() {
  if (hideTimer !== undefined) {
    clearTimeout(hideTimer)
    hideTimer = undefined
  }
  if (visible) return

  visible = true
  shownAt = performance.now()
  NProgress.start()
}

/** Signal that the current navigation has settled. */
export function finishNavigationProgress() {
  if (!visible) return

  const remaining = Math.max(0, MIN_VISIBLE_MS - (performance.now() - shownAt))
  if (hideTimer !== undefined) {
    clearTimeout(hideTimer)
  }
  hideTimer = window.setTimeout(() => {
    hideTimer = undefined
    visible = false
    NProgress.done()
  }, remaining)
}
