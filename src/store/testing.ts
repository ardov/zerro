import type { TDataStore } from '@/6-shared/types'

import type { RootState } from './rootReducer'
import { rootReducer } from './rootReducer'

/**
 * Builds a clean application state around a Core data store. Defaults come
 * from the real root reducer, so adding an unrelated slice does not require
 * updating test fixtures.
 */
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
