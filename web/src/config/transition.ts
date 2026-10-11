import type { TransitionStyle } from "../lib/transitionStyles";

/**
 * Navigation progress + page-transition configuration.
 *
 * Data only — see `lib/transitionStyles.ts` for the code that consumes it and
 * publishes the visual tunables as CSS custom properties.
 */
export const transitions = {
    progress: {
        /** Keep the bar visible at least this long once it has started. */
        minVisibleMs: 320,
        /** Bar thickness. */
        heightPx: 2,
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
        enabled: false,
        /** Cross-fade preset — see {@link TransitionStyle}. */
        style: "fade" as TransitionStyle,
        /** How long the outgoing page animates out. */
        outDurationMs: 160,
        /** How long the incoming page animates in. */
        inDurationMs: 180,
        /** Timing function shared by both phases. */
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        /** Vertical/horizontal travel distance (px) for the slide presets. */
        enterOffsetPx: 4,
    },
} as const;
