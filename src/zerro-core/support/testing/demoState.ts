import type { RootState } from '@/store'
import { makeDemoStore, type TDemoDataOptions } from '../demo'
import type { TDataStore } from '../../internal/domain/zenmoney/model/store'
import { makeTestRootState } from '@/store/testing'

export const coreNextDemoOptions = {
  now: '2026-04-15T12:00:00.000Z',
  until: '2026-03-31',
  scale: 0.35,
} satisfies TDemoDataOptions

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
  return makeTestRootState(data)
}
