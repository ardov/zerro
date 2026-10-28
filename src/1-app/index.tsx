import { initSentry } from '@/6-shared/diagnostics'
import { store } from '@/store'
import { resetData } from '@/store/data'
import { useEffect } from 'react'
import { startAppUpdates } from '@/4-features/appUpdates'
import { registerSW } from 'virtual:pwa-register'

import GlobalErrorBoundary from './GlobalErrorBoundary'
import App from './App'
import { Providers } from './Providers'
initSentry()
createZerroInstance(store)

export const MainApp = () => {
  useEffect(() => startAppUpdates(registerSW), [])
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
  let logsShow = localStorage.getItem('showLogs') === 'true'

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
      localStorage.setItem('showLogs', String(logsShow))
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
