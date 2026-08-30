import type { ReactNode } from 'react'
import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { GlobalWidgets } from '1-app/GlobalWidgets'
import { Providers } from '1-app/Providers'
import { OverlayHost } from '6-shared/overlays'
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
      {localeReady && (
        <MemoryRouter key={`${route}:${locale}`} initialEntries={[route]}>
          <OverlayHost>
            {props.children}
            {app?.globalWidgets && <GlobalWidgets />}
          </OverlayHost>
        </MemoryRouter>
      )}
    </Providers>
  )
}
