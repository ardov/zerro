import { useMediaQuery } from '@material-ui/core'
import createPersistedState from 'use-persisted-state'

const useUserTheme = createPersistedState('theme')

export function useThemeType() {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')
  const [userTheme, setUserTheme] = useUserTheme<'light' | 'dark' | null>(null)
  const systemTheme = prefersDark ? 'dark' : 'light'
  const currentTheme = userTheme ? userTheme : systemTheme
  return {
    type: currentTheme,
    toggle: () =>
      setUserTheme(() => {
        if (currentTheme !== systemTheme) return null
        else return currentTheme === 'dark' ? 'light' : 'dark'
      }),
  }
}
