import type { FC, ReactNode } from 'react'
import { useLayoutEffect, useState } from 'react'
import type { TColorSchemePreference } from './hooks'
import {
  forceColorScheme,
  migrateStoredColorScheme,
  useAppTheme,
  useColorScheme,
} from './hooks'
import { themeTokensCss } from './tokens'

import './styles.scss'

migrateStoredColorScheme()

export type AppThemeProviderProps = {
  /** Pins the scheme instead of reading the user's preference, and stops
   * anything below from writing one. Stories render both schemes side by side
   * and must not leave a choice behind in the browser. */
  defaultMode?: TColorSchemePreference
  children?: ReactNode
}

/** Puts the palette on the page.
 *
 * There is no theme context: the tokens are one stylesheet carrying both
 * schemes, and which of them applies is the `dark` class on the root. A
 * component that needs a colour as a value rather than as a property reaches
 * for `useAppTheme`. */
export const AppThemeProvider: FC<AppThemeProviderProps> = props => {
  // During the first render, before anything below has subscribed — a story
  // that pins a scheme must not paint the other one first.
  useState(() => forceColorScheme(props.defaultMode ?? null))

  return (
    <>
      <style>{themeTokensCss}</style>
      <ColorSchemeClass />
      {props.children}
    </>
  )
}

const ColorSchemeClass: FC = () => {
  const { mode } = useColorScheme()
  const { palette } = useAppTheme()

  useLayoutEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', mode === 'dark')

    return () => root.classList.remove('dark')
  }, [mode])

  return <meta name="theme-color" content={palette.background.paper} />
}
