/**
 * Navigation progress + page-transition configuration.
 *
 * JS-side values only: the nprogress options, how long the bar stays visible
 * once started, and whether navigations default to a View Transition. Visual
 * timings for the page cross-fade live in `styles/global.css`.
 */
export const transitions = {
  progress: {
    /** Keep the bar visible at least this long once it has started. */
    minVisibleMs: 320,
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
  },
} as const

export type Transitions = typeof transitions
