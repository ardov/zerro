import {
  useColorScheme as useMuiColorScheme,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useCallback } from 'react'

export const THEME_KEY = 'theme'

export const useAppTheme = () => useTheme()

export function useColorScheme() {
  const { mode, setMode } = useMuiColorScheme()
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')
  const systemTheme = prefersDark ? 'dark' : 'light'

  const toggle = useCallback(() => {
    if (!mode || mode === 'system') {
      setMode(systemTheme === 'dark' ? 'light' : 'dark')
      return
    }
    const nextTheme = mode === 'light' ? 'dark' : 'light'
    setMode(nextTheme === systemTheme ? 'system' : nextTheme)
  }, [mode, setMode, systemTheme])

  return {
    mode: !mode || mode === 'system' ? systemTheme : mode,
    toggle,
  }
}

export function fixOldTheme() {
  const theme = localStorage.getItem(THEME_KEY)
  if (theme === '"dark"') {
    localStorage.setItem(THEME_KEY, 'dark')
  }
  if (theme === '"light"') {
    localStorage.setItem(THEME_KEY, 'light')
  }
}
