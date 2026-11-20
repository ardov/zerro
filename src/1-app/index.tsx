import { isEmbeddedDemo } from '@/6-shared/embeddedDemo'
import { loadDemoData } from '@/4-features/authorization'
import { i18n } from '@/6-shared/localization'
import { initSentry } from '@/6-shared/diagnostics'
import { safeLocalStorage } from '@/6-shared/api/browserStorage'
import { store } from '@/store'
import { resetData } from '@/store/data'
import { useEffect, useState } from 'react'
import { startDailyBackups } from '@/4-features/export/dailyBackup'
import { startAppUpdates } from '@/4-features/appUpdates'
import { registerSW } from 'virtual:pwa-register'

import GlobalErrorBoundary from './GlobalErrorBoundary'
import App from './App'
import { Providers } from './Providers'
if (!isEmbeddedDemo) initSentry()
createZerroInstance(store)

export const MainApp = () => {
  const [demoReady, setDemoReady] = useState(!isEmbeddedDemo)
  useEffect(() => {
    if (!isEmbeddedDemo) return
    const language = new URLSearchParams(location.search).get('lang')
    void (async () => {
      if (language === 'ru' || language === 'en')
        await i18n.changeLanguage(language)
      await store.dispatch(loadDemoData())
      setDemoReady(true)
    })()
  }, [])
  useEffect(() => {
    if (!isEmbeddedDemo) return
    const updateAppearance = (event: MessageEvent) => {
      if (
        event.source !== window.parent ||
        event.origin !== window.location.origin ||
        event.data?.type !== 'zerro-demo-appearance'
      )
        return
      const { language, theme } = event.data
      if (language === 'ru' || language === 'en')
        void i18n.changeLanguage(language)
      if (
        (theme === 'light' || theme === 'dark') &&
        window.themeManager?.getTheme() !== theme
      )
        window.themeManager?.toggle()
    }
    window.addEventListener('message', updateAppearance)
    window.parent.postMessage(
      { type: 'zerro-demo-ready' },
      window.location.origin
    )
    return () => window.removeEventListener('message', updateAppearance)
  }, [])
  useEffect(() => {
    if (!isEmbeddedDemo || !demoReady) return
    const frame = requestAnimationFrame(() => {
      window.parent.postMessage(
        { type: 'zerro-demo-loaded' },
        window.location.origin
      )
    })
    return () => cancelAnimationFrame(frame)
  }, [demoReady])
  useEffect(() => {
    if (!isEmbeddedDemo) return startDailyBackups(store)
  }, [])
  useEffect(() => {
    if (!isEmbeddedDemo) return startAppUpdates(registerSW)
  }, [])
  if (!demoReady) return null
  return (
    <GlobalErrorBoundary>
      <Providers store={store}>
        <App />
      </Providers>
    </GlobalErrorBoundary>
  )
}

/** `zerro` can be used in console to access state and modify data */
function createZerroInstance(s: typeof store) {
  let logsShow = safeLocalStorage.getItem('showLogs') === 'true'

  // @ts-expect-error window.zerro is an untyped debug object
  window.zerro = {
    get state() {
      return s.getState()
    },
    env: import.meta.env,
    get logsShow() {
      return logsShow
    },
    toggleLogs: () => {
      logsShow = !logsShow
      safeLocalStorage.setItem('showLogs', String(logsShow))
      return logsShow
    },
    logs: {},
    resetData: () => s.dispatch(resetData()),
    showEl: (id: string) => {
      const data = s.getState().data.current
      return (
        Object.values(data)
          // @ts-expect-error indexing a union of collections
          .map(c => c[id])
          .filter(Boolean)[0]
      )
    },
  }
}
