import { addons } from 'storybook/manager-api'
import { themes } from 'storybook/theming'

type ThemeGlobal = 'light' | 'dark'

function applyTheme(theme: ThemeGlobal = 'light') {
  addons.setConfig({ theme: theme === 'dark' ? themes.dark : themes.light })
}

applyTheme()

const browserWindow = globalThis as unknown as {
  location: { origin: string }
  addEventListener: (
    type: string,
    listener: (event: {
      origin: string
      data?: { type?: string; theme?: ThemeGlobal }
    }) => void
  ) => void
}

browserWindow.addEventListener('message', event => {
  if (event.origin !== browserWindow.location.origin) return
  if (event.data?.type !== 'zerro-storybook-theme') return
  applyTheme(event.data.theme)
})
