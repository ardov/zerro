import type { TDiff } from '6-shared/types'

import React from 'react'
import '6-shared/localization'
import { initSentry } from '6-shared/helpers/tracking'
import { store } from 'store'
import { bindWorkerToStore } from 'worker'
import { applyClientPatch, resetData } from 'store/data'
import GlobalErrorBoundary from './GlobalErrorBoundary'
import App from './App'
import { Providers } from './Providers'
import { registerSW } from 'virtual:pwa-register'

registerSW({ immediate: true })
initSentry()
bindWorkerToStore(store.dispatch)
createZerroInstance(store)

export const MainApp = () => (
  <GlobalErrorBoundary>
    <Providers store={store}>
      <App />
    </Providers>
  </GlobalErrorBoundary>
)

/** `zerro` can be used in console to access state and modify data */
function createZerroInstance(s: typeof store) {
  let logsShow = localStorage.getItem('showLogs') === 'true'

  // @ts-ignore
  window.zerro = {
    get state() {
      return s.getState()
    },
    // @ts-ignore
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
    applyClientPatch: (patch: TDiff) => s.dispatch(applyClientPatch(patch)),
    showEl: (id: string) => {
      let data = s.getState().data.current
      return (
        Object.values(data)
          // @ts-ignore
          .map(c => c[id])
          .filter(Boolean)[0]
      )
    },
  }
}
