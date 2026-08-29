import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { useMediaQueryValue } from '6-shared/hooks/useMediaQueryValue'
import type { TColorScheme } from './palette'
import { palettes } from './palette'

/** What the user chose, which is not the same as which scheme is on screen:
 * `system` defers to the device and follows it as it changes. */
export type TColorSchemePreference = TColorScheme | 'system'

const STORAGE_KEY = 'zerro-color-scheme'
/** The keys this preference has lived under: MUI's `useColorScheme` wrote
 * `mui-mode`, and something older wrote a JSON-quoted value to `theme`. */
const LEGACY_KEYS = ['mui-mode', 'theme']

const isPreference = (value: unknown): value is TColorSchemePreference =>
  value === 'light' || value === 'dark' || value === 'system'

function read(): TColorSchemePreference {
  if (typeof localStorage === 'undefined') return 'system'
  const stored = localStorage.getItem(STORAGE_KEY)
  return isPreference(stored) ? stored : 'system'
}

/** Moves the preference onto a key this app owns. MUI named the old one and
 * is on its way out; a user who has chosen a scheme should not have to choose
 * it again because of that. */
export function migrateStoredColorScheme() {
  if (typeof localStorage === 'undefined') return
  if (localStorage.getItem(STORAGE_KEY)) return
  for (const key of LEGACY_KEYS) {
    const stored = localStorage.getItem(key)
    if (!stored) continue
    // The oldest of them holds a JSON string rather than a bare value.
    const value = stored.startsWith('"') ? stored.slice(1, -1) : stored
    if (isPreference(value)) {
      localStorage.setItem(STORAGE_KEY, value)
      return
    }
  }
}

/** One store for every caller, so that the settings row and the provider that
 * paints the page cannot hold different ideas of the current scheme. */
const listeners = new Set<() => void>()
let preference: TColorSchemePreference | null = null
/** Set by the provider when a caller pins the scheme — stories do — in which
 * case nothing is read from or written to storage. */
let forced: TColorSchemePreference | null = null

const store = {
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  getSnapshot(): TColorSchemePreference {
    if (forced) return forced
    preference ??= read()
    return preference
  },
}

const emit = () => listeners.forEach(listener => listener())

function setPreference(next: TColorSchemePreference) {
  if (forced) return
  preference = next
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // A browser with storage turned off still gets the scheme it asked for,
    // just not on its next visit.
  }
  emit()
}

/** Pins the scheme for everything below the provider, or releases it. */
export function forceColorScheme(next: TColorSchemePreference | null) {
  if (forced === next) return
  forced = next
  emit()
}

const getServerSnapshot = (): TColorSchemePreference => 'system'

/**
 * The scheme on screen and a control that cycles it.
 *
 * The toggle collapses back to `system` whenever the scheme it would land on
 * is the one the device already asks for, so a user who never disagreed with
 * their device keeps following it.
 */
export function useColorScheme() {
  const preference = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    getServerSnapshot
  )
  const prefersDark = useMediaQueryValue('(prefers-color-scheme: dark)')
  const systemScheme: TColorScheme = prefersDark ? 'dark' : 'light'

  const toggle = useCallback(() => {
    if (preference === 'system') {
      setPreference(systemScheme === 'dark' ? 'light' : 'dark')
      return
    }
    const next = preference === 'light' ? 'dark' : 'light'
    setPreference(next === systemScheme ? 'system' : next)
  }, [preference, systemScheme])

  const mode: TColorScheme = preference === 'system' ? systemScheme : preference

  return { mode, toggle }
}

/** The palette for the scheme on screen.
 *
 * It is a palette rather than a theme: everything else the MUI theme carried —
 * spacing, breakpoints, typography, the shadows — is either a Tailwind token
 * or `breakpoints.ts`. What is left is the colours a chart or an SVG has to be
 * handed as a value, because a CSS variable cannot reach a `stroke` attribute. */
export function useAppTheme() {
  const { mode } = useColorScheme()
  return useMemo(() => ({ palette: palettes[mode] }), [mode])
}
