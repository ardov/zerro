import type { FC, ReactNode } from 'react'
import { useLayoutEffect } from 'react'
import type { ColorScheme } from './colors'
import { themeTokensCss } from './colors'
import { getThemeColor } from '../kit/themeColor'
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

  return <meta name="theme-color" content={getThemeColor(mode)} />
}
