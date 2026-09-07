import type { FC, ReactNode } from 'react'
import { useLayoutEffect } from 'react'
import type { ColorScheme } from './colors'
import { getThemeColor, themeTokensCss } from './colors'
import { ColorSchemeOverrideContext, useColorScheme } from './hooks'

import './styles.css'

export type AppThemeProviderProps = {
  /** Pins an isolated renderer to one scheme without changing the application
   * preference. The application itself leaves this unset. */
  defaultMode?: ColorScheme
  children?: ReactNode
}

/** Injects both generated token blocks. The page-level theme manager owns the
 * root class and storage; a pinned renderer temporarily mirrors its local
 * scheme onto the root for CSS tokens. */
export const AppThemeProvider: FC<AppThemeProviderProps> = props => {
  const override = props.defaultMode ?? null

  return (
    <ColorSchemeOverrideContext.Provider value={override}>
      <style>{themeTokensCss}</style>
      <ColorSchemeMetadata pinned={override !== null} />
      {props.children}
    </ColorSchemeOverrideContext.Provider>
  )
}

/** Mirrors a pinned renderer's scheme onto the root so the CSS tokens follow
 * it, and hands back the undo. */
function pinScheme(root: HTMLElement, mode: ColorScheme) {
  const wasDark = root.classList.contains('dark')
  const previousColorScheme = root.style.colorScheme
  root.classList.toggle('dark', mode === 'dark')
  root.style.colorScheme = mode

  return () => {
    root.classList.toggle('dark', wasDark)
    root.style.colorScheme = previousColorScheme
  }
}

const ColorSchemeMetadata: FC<{ pinned: boolean }> = ({ pinned }) => {
  const { mode } = useColorScheme()

  useLayoutEffect(() => {
    if (!pinned) return
    return pinScheme(document.documentElement, mode)
  }, [mode, pinned])

  /* The last colour anything reads as a value: `content` is an attribute and
     not a CSS property, so no token can reach it.
     It is read from the generated token decision and not back out of the
     cascade, even though the token is written to be readable. `getComputedStyle` forces a style
     recalculation, and that is not free to anyone else on the page: an element
     mounting into a transitioned state stops starting there and animates into
     it instead, because the recalculation gives the transition a previous
     value to run from. `OutlinedField`'s floating label is one.
     Reading the value here keeps colours inside the module that owns them,
     which is the point — no feature code imports a scale or level. */
  return <meta name="theme-color" content={getThemeColor(mode)} />
}
