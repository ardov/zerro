import type { TDataStore } from '@/6-shared/types'

import type { RootState } from './rootReducer'
import { rootReducer } from './rootReducer'

export function makeTestRootState(
  current: TDataStore,
  overrides: Partial<RootState> = {}
): RootState {
  const initialState = rootReducer(undefined, { type: 'test/init' })

  return {
    ...initialState,
    data: {
      ...initialState.data,
      current,
      base: current,
      outbox: [],
      redo: [],
    },
    ...overrides,
  }
}
