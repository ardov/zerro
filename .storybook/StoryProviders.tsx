import type { ReactNode } from 'react'
import { useEffect, useLayoutEffect, useMemo } from 'react'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { GlobalWidgets } from '@/1-app/GlobalWidgets'
import { Providers } from '@/1-app/Providers'
import { OverlayHost } from '@/6-shared/overlays'
import { i18n } from '@/6-shared/localization'
import { SnackbarProvider } from '@/6-shared/ui/SnackbarProvider'
import { AppThemeProvider } from '@/6-shared/ui/theme'
import { TooltipProvider } from '@/6-shared/ui/Tooltip'
import { makeStoryStore, type StoryScenario } from 'stories/fixtures/storyStore'

type ThemeMode = 'light' | 'dark'
type Locale = 'en' | 'ru'

export type AppStoryParameters = {
  app?: {
    scenario?: StoryScenario
    route?: string
    globalWidgets?: boolean
  }
  /** Alt+ArrowLeft and Alt+ArrowRight drive the story's router history. */
  historyShortcuts?: boolean
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

  return (
    <Providers store={store} theme={{ defaultMode: getTheme(context) }}>
      <StoryRouter context={context}>
        {props.children}
        {app?.globalWidgets && <GlobalWidgets />}
      </StoryRouter>
    </Providers>
  )
}

/** The Library uses the same rendering environment as the application without
 * smuggling Redux into reusable components. App Scenarios keep the full store
 * adapter above; a Bench that needs it is a layering leak, not a decorator
 * requirement. */
export function LibraryStoryProviders(props: {
  children: ReactNode
  context: StoryContextLike
}) {
  return (
    <AppThemeProvider defaultMode={getTheme(props.context)}>
      <SnackbarProvider>
        <TooltipProvider>
          <StoryRouter context={props.context}>{props.children}</StoryRouter>
        </TooltipProvider>
      </SnackbarProvider>
    </AppThemeProvider>
  )
}

function StoryRouter(props: {
  children: ReactNode
  context: StoryContextLike
}) {
  const locale = props.context.globals.locale || 'en'
  const route = props.context.parameters.app?.route || '/'

  // Both resource bundles are imported synchronously. Updating before paint
  // keeps the toolbar responsive without blanking the canvas or remounting the
  // router and its Scenario state.
  useLayoutEffect(() => {
    void i18n.changeLanguage(locale)
  }, [locale])

  return (
    <MemoryRouter initialEntries={[route]}>
      {props.context.parameters.historyShortcuts && <HistoryShortcuts />}
      <OverlayHost>{props.children}</OverlayHost>
    </MemoryRouter>
  )
}

/** MemoryRouter does not hear the browser's Back and Forward. These keys stand
 * in for them, on `window` in the capture phase: a popup is drawn by the
 * overlay host, outside the story, and must not see the press first.
 * Opt-in, because Alt+Arrow also moves the caret by word on macOS. */
function HistoryShortcuts() {
  const navigate = useNavigate()
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (!event.altKey) return
      const delta =
        event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0
      if (!delta) return
      event.preventDefault()
      navigate(delta)
    }
    window.addEventListener('keydown', keydown, true)
    return () => window.removeEventListener('keydown', keydown, true)
  }, [navigate])
  return null
}

function getTheme(context: StoryContextLike): ThemeMode {
  return context.globals.theme || 'light'
}
