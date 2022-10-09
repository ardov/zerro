import React from 'react'
import { initSentry } from '@shared/helpers/tracking'
import { TDiff } from '@shared/types'
import { store } from '@store'
import { bindWorkerToStore } from '@worker'
import { applyClientPatch, resetData } from '@store/data'
import GlobalErrorBoundary from './GlobalErrorBoundary'
import App from './App'
import { Providers } from './Providers'

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
  // @ts-ignore
  window.zerro = {
    get state() {
      return s.getState()
    },
    // @ts-ignore
    env: import.meta.env,
    logsShow: false,
    logs: {},
    resetData: () => s.dispatch(resetData()),
    applyClientPatch: (patch: TDiff) => s.dispatch(applyClientPatch(patch)),
  }
}
