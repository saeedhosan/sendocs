import { useTheme } from '../../app/providers/useTheme'
import { MonitorIcon, MoonIcon, SunIcon } from '../../components/icons'

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme()

  const icons = {
    light: <SunIcon size={18} className="text-ink-secondary" aria-hidden="true" />,
    dark: <MoonIcon size={18} className="text-ink-secondary" aria-hidden="true" />,
    system: <MonitorIcon size={18} className="text-ink-secondary" aria-hidden="true" />,
  }

  const labels = {
    light: 'Light mode',
    dark: 'Dark mode',
    system: 'System preference',
  }

  return (
    <div className="relative" role="group" aria-label="Theme selector">
      <button
        type="button"
        className="inline-flex items-center justify-center cursor-pointer transition-colors duration-150 hover:text-ink size-8 rounded-md bg-transparent text-ink-secondary hover:bg-surface-subtle"
        aria-label={`Current theme: ${labels[theme]}. Click to change.`}
        onClick={() => {
          const themes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system']
          const currentIndex = themes.indexOf(theme)
          const nextTheme = themes[(currentIndex + 1) % themes.length]
          setTheme(nextTheme)
        }}
        title={labels[theme]}
      >
        {icons[resolvedTheme]}
      </button>
    </div>
  )
}