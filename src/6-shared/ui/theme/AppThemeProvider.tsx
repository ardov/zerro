import type { FC, ReactNode } from 'react'
import { useLayoutEffect } from 'react'
import type { ColorScheme } from './colors'
import { themeTokensCss } from './colors'
import { getThemeColor } from '../kit/themeColor'
import { ColorSchemeOverrideContext } from './hooks'

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
      {override && <PinnedScheme mode={override} />}
      {props.children}
    </ColorSchemeOverrideContext.Provider>
  )
}

const PinnedScheme: FC<{ mode: ColorScheme }> = ({ mode }) => {
  useLayoutEffect(() => {
    const root = document.documentElement
    const wasDark = root.classList.contains('dark')
    const previousColorScheme = root.style.colorScheme
    root.classList.toggle('dark', mode === 'dark')
    root.style.colorScheme = mode

    return () => {
      root.classList.toggle('dark', wasDark)
      root.style.colorScheme = previousColorScheme
    }
  }, [mode])

  return <meta name="theme-color" content={getThemeColor(mode)} />
}
