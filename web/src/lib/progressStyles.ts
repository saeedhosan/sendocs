/**
 * Colour for the stock Progress indicator, using the same Tailwind palette as
 * the status badges: green when complete, amber while waiting. The vendored
 * Progress component stays untouched; the indicator is targeted through its
 * `data-slot`.
 */
export function progressIndicatorClass(tone: 'complete' | 'waiting'): string {
  return tone === 'complete'
    ? '[&_[data-slot=progress-indicator]]:bg-green-500'
    : '[&_[data-slot=progress-indicator]]:bg-amber-500'
}
