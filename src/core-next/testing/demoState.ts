import type { RootState } from 'store'
import { makeDemoStore, type TDemoDataOptions } from '../demo'
import type { TDataStore } from '6-shared/types'
import type { TZerroSessionContext } from '../facade'

export const coreNextDemoOptions = {
  now: '2026-04-15T12:00:00.000Z',
  until: '2026-03-31',
  scale: 0.35,
} satisfies TDemoDataOptions

export const coreNextDemoContext: TZerroSessionContext = {
  now: () => Date.parse(coreNextDemoOptions.now),
  uuid: () => 'core-next-demo-test-id',
}

export function makeCoreNextDemoStore(
  options: TDemoDataOptions = {}
): TDataStore {
  return makeDemoStore({
    ...coreNextDemoOptions,
    ...options,
  })
}

export function makeCoreNextDemoRootState(
  data: TDataStore = makeCoreNextDemoStore()
): RootState {
  return {
    data: {
      current: data,
      server: data,
      diff: undefined,
    },
    displayCurrency: null,
    isPending: false,
    lastSync: {
      finishedAt: 0,
      isSuccessful: null,
      errorMessage: null,
    },
    token: null,
  }
}
