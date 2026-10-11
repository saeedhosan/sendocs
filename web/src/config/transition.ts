/**
 * Navigation progress + page-transition configuration.
 *
 * JS-side values (the nprogress options, the progress bar's minimum visible
 * time, and whether navigations default to a View Transition) are consumed
 * directly. The visual tunables (bar thickness, cross-fade preset, durations,
 * easing, travel distance) are published as CSS custom properties on `:root`
 * by {@link applyTransitionStyles}, which `styles/global.css` and
 * `navigationProgress.css` consume with matching fallbacks.
 */

/** Available page cross-fade presets. `none` disables the animation. */
export type TransitionStyle =
  | 'fade'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'none'

export const TRANSITION_STYLES: readonly TransitionStyle[] = [
  'fade',
  'slide-up',
  'slide-down',
  'slide-left',
  'slide-right',
  'none',
]

/** Maps each preset to its outgoing/incoming `@keyframes` names. */
const STYLE_KEYFRAMES: Record<TransitionStyle, { out: string; in: string }> = {
  fade: { out: 'route-fade-out', in: 'route-fade-in' },
  'slide-up': { out: 'route-slide-out-up', in: 'route-slide-in-up' },
  'slide-down': { out: 'route-slide-out-down', in: 'route-slide-in-down' },
  'slide-left': { out: 'route-slide-out-left', in: 'route-slide-in-left' },
  'slide-right': { out: 'route-slide-out-right', in: 'route-slide-in-right' },
  none: { out: 'none', in: 'none' },
}

/** The `@keyframes` names used by a preset. */
export function transitionKeyframes(style: TransitionStyle) {
  return STYLE_KEYFRAMES[style]
}

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
    /** Cross-fade preset — see {@link TransitionStyle}. */
    style: 'fade' as TransitionStyle,
    /** How long the outgoing page animates out. */
    outDurationMs: 160,
    /** How long the incoming page animates in. */
    inDurationMs: 180,
    /** Timing function shared by both phases. */
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    /** Vertical/horizontal travel distance (px) for the slide presets. */
    enterOffsetPx: 4,
  },
} as const

export type Transitions = typeof transitions

const { out: outKeyframes, in: inKeyframes } = transitionKeyframes(
  transitions.view.style,
)

const CSS_VARS: Record<string, string> = {
  '--nav-progress-height': `${transitions.progress.heightPx}px`,
  '--page-transition-out-name': outKeyframes,
  '--page-transition-in-name': inKeyframes,
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
