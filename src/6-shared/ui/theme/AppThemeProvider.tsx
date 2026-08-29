import type { FC, ReactNode } from 'react'
import { useLayoutEffect } from 'react'
import type { TColorScheme } from './palette'
import { ColorSchemeOverrideContext, useAppTheme } from './hooks'
import { themeTokensCss } from './tokens'

import './styles.scss'

export type AppThemeProviderProps = {
  /** Pins an isolated renderer to one scheme without changing the application
   * preference. The application itself leaves this unset. */
  defaultMode?: TColorScheme
  children?: ReactNode
}

/** Provides palette values that cannot be expressed through CSS variables.
 * The page-level theme manager owns the root class and storage; a pinned
 * renderer temporarily mirrors its local scheme onto the root for CSS tokens. */
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

const ColorSchemeMetadata: FC<{ pinned: boolean }> = ({ pinned }) => {
  const { palette } = useAppTheme()

  useLayoutEffect(() => {
    if (!pinned) return

    const root = document.documentElement
    const wasDark = root.classList.contains('dark')
    const previousColorScheme = root.style.colorScheme
    root.classList.toggle('dark', palette.mode === 'dark')
    root.style.colorScheme = palette.mode

    return () => {
      root.classList.toggle('dark', wasDark)
      root.style.colorScheme = previousColorScheme
    }
  }, [palette.mode, pinned])

  return <meta name="theme-color" content={palette.background.paper} />
}
