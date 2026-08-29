import type { ReactNode } from 'react'
import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { GlobalWidgets } from '1-app/GlobalWidgets'
import { Providers } from '1-app/Providers'
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import { storyTheme } from '6-shared/ui/theme/storyTheme'
import { PopoverManager } from '6-shared/historyPopovers'
import { i18n } from '6-shared/localization'
import { makeStoryStore, type StoryScenario } from 'stories/fixtures/storyStore'

type ThemeMode = 'light' | 'dark'
type Locale = 'en' | 'ru'

function subscribeToLanguage(listener: () => void) {
  i18n.on('languageChanged', listener)
  return () => i18n.off('languageChanged', listener)
}

function getCurrentLanguage() {
  return (i18n.resolvedLanguage || i18n.language).split('-')[0]
}

export type AppStoryParameters = {
  app?: {
    scenario?: StoryScenario
    route?: string
    globalWidgets?: boolean
  }
}

type StoryContextLike = {
  id: string
  globals: {
    theme?: ThemeMode
    locale?: Locale
  }
  parameters: AppStoryParameters
}

export function StoryProviders(props: {
  children: ReactNode
  context: StoryContextLike
}) {
  const { context } = props
  const app = context.parameters.app
  const scenario = app?.scenario || 'demo'
  const store = useMemo(() => makeStoryStore(scenario), [scenario])
  const theme = context.globals.theme || 'light'
  const locale = context.globals.locale || 'en'
  const route = app?.route || '/'
  const currentLocale = useSyncExternalStore(
    subscribeToLanguage,
    getCurrentLanguage,
    getCurrentLanguage
  )
  const localeReady = currentLocale === locale

  useEffect(() => {
    if (!localeReady) void i18n.changeLanguage(locale)
  }, [locale, localeReady])

  useEffect(() => {
    document.documentElement.dataset.zerroStorybookTheme = theme
    if (window.parent !== window) {
      window.parent.postMessage(
        { type: 'zerro-storybook-theme', theme },
        window.location.origin
      )
    }
  }, [theme])

  return (
    <Providers store={store} theme={{ defaultMode: theme }}>
      {/* The app is off the MUI theme; the parity stories are not, because an
          unthemed MUI component is Roboto on a 4px radius and would fail every
          comparison for a reason that is not the component's. It is mounted
          here rather than in `Providers` so that nothing the application ships
          can reach it. Both halves are pinned to the story's own scheme. */}
      <MuiThemeProvider
        theme={storyTheme}
        defaultMode={theme}
        storageManager={null}
      >
        {localeReady && (
          <MemoryRouter key={`${route}:${locale}`} initialEntries={[route]}>
            <PopoverManager>
              {props.children}
              {app?.globalWidgets && <GlobalWidgets />}
            </PopoverManager>
          </MemoryRouter>
        )}
      </MuiThemeProvider>
    </Providers>
  )
}
