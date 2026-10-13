import { describe, expect, it } from 'vitest'
import globalCss from '../../../src/main.css?raw'
import { transitions } from '../../../src/config/transition'
import {
  TRANSITION_STYLES,
  applyTransitionStyles,
  transitionKeyframes,
} from '../../../src/lib/transitionStyles'

describe('transition styles', () => {
  it('resolves every preset to real keyframes in global.css', () => {
    for (const style of TRANSITION_STYLES) {
      const { out, in: incoming } = transitionKeyframes(style)

      expect(out).toBeTruthy()
      expect(incoming).toBeTruthy()

      if (style === 'none') {
        expect(out).toBe('none')
        expect(incoming).toBe('none')
        continue
      }

      expect(globalCss).toContain(`@keyframes ${out}`)
      expect(globalCss).toContain(`@keyframes ${incoming}`)
    }
  })

  it('publishes the configured preset and timings as CSS variables', () => {
    const root = document.createElement('div')

    applyTransitionStyles(root)

    const { out, in: incoming } = transitionKeyframes(transitions.view.style)
    expect(root.style.getPropertyValue('--page-transition-out-name')).toBe(out)
    expect(root.style.getPropertyValue('--page-transition-in-name')).toBe(incoming)
    expect(root.style.getPropertyValue('--page-transition-enter-offset')).toBe(
      `${transitions.view.enterOffsetPx}px`,
    )
    expect(root.style.getPropertyValue('--nav-progress-height')).toBe(
      `${transitions.progress.heightPx}px`,
    )
  })
})
