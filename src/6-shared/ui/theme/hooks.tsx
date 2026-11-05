import { createContext, useContext, useSyncExternalStore } from 'react'
import type { ColorScheme } from './colors'

type ThemeManager = {
  getTheme: () => ColorScheme
  toggle: () => void
  subscribe: (listener: () => void) => () => void
}

declare global {
  interface Window {
    /** Attached by public/theme-init.js, loaded before the application. */
    themeManager?: ThemeManager
  }
}

const getThemeManager = () => {
  const manager = window.themeManager
  if (!manager) {
    throw new Error('No theme manager. Check if /theme-init.js is loaded.')
  }
  return manager
}

const subscribe = (listener: () => void) =>
  getThemeManager().subscribe(listener)
const getSnapshot = () => getThemeManager().getTheme()
const getServerSnapshot = (): ColorScheme => 'light'
const toggleTheme = () => getThemeManager().toggle()
const ignoreToggle = () => {}

/** A local override for isolated renderers such as Storybook. It never changes
 * the application preference kept by the page-level theme manager. */
export const ColorSchemeOverrideContext = createContext<ColorScheme | null>(
  null
)

/** The resolved scheme on screen and its reversible two-state toggle. */
export function useColorScheme() {
  const override = useContext(ColorSchemeOverrideContext)
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  return {
    mode: override ?? theme,
    toggle: override ? ignoreToggle : toggleTheme,
  }
}
