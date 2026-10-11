/**
 * Navigation progress + page-transition configuration.
 *
 * JS-side values (the nprogress options, the progress bar's minimum visible
 * time, and whether navigations default to a View Transition) are consumed
 * directly. The visual tunables (bar thickness, cross-fade durations/easing,
 * enter offset) are published as CSS custom properties on `:root` by
 * {@link applyTransitionStyles}, which `styles/global.css` and
 * `navigationProgress.css` consume with matching fallbacks.
 */
export const transitions = {
  progress: {
    /** Keep the bar visible at least this long once it has started. */
    minVisibleMs: 320,
    /** Bar thickness. */
    heightPx: 3,
    /** Passed straight to `NProgress.configure`. */
    nprogress: {
      showSpinner: false,
      minimum: 0.08,
      speed: 200,
      trickleSpeed: 200,
    },
  },
  view: {
    /** Default every navigation to a browser View Transition. */
    enabled: true,
    /** How long the outgoing page fades out. */
    outDurationMs: 160,
    /** How long the incoming page fades in. */
    inDurationMs: 180,
    /** Timing function shared by both phases. */
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    /** Vertical offset (px) the incoming page rises from. */
    enterOffsetPx: 4,
  },
} as const

export type Transitions = typeof transitions

const CSS_VARS: Record<string, string> = {
  '--nav-progress-height': `${transitions.progress.heightPx}px`,
  '--page-transition-out-duration': `${transitions.view.outDurationMs}ms`,
  '--page-transition-in-duration': `${transitions.view.inDurationMs}ms`,
  '--page-transition-easing': transitions.view.easing,
  '--page-transition-enter-offset': `${transitions.view.enterOffsetPx}px`,
}

/** Publish the CSS-facing tunables as custom properties on the root element. */
export function applyTransitionStyles(root: HTMLElement = document.documentElement) {
  for (const [name, value] of Object.entries(CSS_VARS)) {
    root.style.setProperty(name, value)
  }
}
