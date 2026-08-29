import { createContext, useContext, useMemo, useSyncExternalStore } from 'react'
import type { TColorScheme } from './palette'
import { palettes } from './palette'

type ThemeManager = {
  getTheme: () => TColorScheme
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
const getServerSnapshot = (): TColorScheme => 'light'
const toggleTheme = () => getThemeManager().toggle()
const ignoreToggle = () => {}

/** A local override for isolated renderers such as Storybook. It never changes
 * the application preference kept by the page-level theme manager. */
export const ColorSchemeOverrideContext = createContext<TColorScheme | null>(
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

/** The palette for the scheme on screen.
 *
 * It is a palette rather than a theme: spacing, breakpoints, typography and
 * shadows are either Tailwind tokens
 * or `breakpoints.ts`. What is left is the colours a chart or an SVG has to be
 * handed as a value, because a CSS variable cannot reach a `stroke` attribute. */
export function useAppTheme() {
  const { mode } = useColorScheme()
  return useMemo(() => ({ palette: palettes[mode] }), [mode])
}
