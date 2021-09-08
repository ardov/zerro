import { useMediaQuery } from '@mui/material'
import { createLocalStorageStateHook } from 'use-local-storage-state'

type UserTheme = 'light' | 'dark' | null
const useUserTheme = createLocalStorageStateHook<UserTheme>('theme', null)

export function useThemeType() {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')
  const systemTheme = prefersDark ? 'dark' : 'light'
  const [userTheme, setUserTheme] = useUserTheme()
  const currentTheme = userTheme || systemTheme
  return {
    type: currentTheme,
    toggle: () => {
      let newTheme: UserTheme = currentTheme === 'dark' ? 'light' : 'dark'
      if (newTheme === systemTheme) newTheme = null
      setUserTheme(newTheme)
    },
  }
}
