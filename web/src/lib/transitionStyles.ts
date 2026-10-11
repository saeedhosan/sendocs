import { transitions } from '../config/transition'

/** Available page cross-fade presets. `none` disables the animation. */
export type TransitionStyle =
  | 'fade'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'none'

export type Transitions = typeof transitions

/** Maps each preset to its outgoing/incoming `@keyframes` names. */
const STYLE_KEYFRAMES: Record<TransitionStyle, { out: string; in: string }> = {
  fade: { out: 'route-fade-out', in: 'route-fade-in' },
  'slide-up': { out: 'route-slide-out-up', in: 'route-slide-in-up' },
  'slide-down': { out: 'route-slide-out-down', in: 'route-slide-in-down' },
  'slide-left': { out: 'route-slide-out-left', in: 'route-slide-in-left' },
  'slide-right': { out: 'route-slide-out-right', in: 'route-slide-in-right' },
  none: { out: 'none', in: 'none' },
}

export const TRANSITION_STYLES = Object.keys(
  STYLE_KEYFRAMES,
) as TransitionStyle[]

/** The `@keyframes` names used by a preset. */
export function transitionKeyframes(style: TransitionStyle) {
  return STYLE_KEYFRAMES[style]
}

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
