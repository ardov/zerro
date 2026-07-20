import type { RootState } from 'store'
import type { TDataStore } from '../../internal/domain/zenmoney/model/store'

/**
 * Builds a minimal RootState around a data store for adapter/selector tests.
 * `base` mirrors `current` and the outbox is empty, so selectors see a clean,
 * fully-synced replica. Pass `overrides` for the rare field a test cares about
 * (e.g. `displayCurrency`).
 */
export function makeTestRootState(
  current: TDataStore,
  overrides: Partial<RootState> = {}
): RootState {
  return {
    data: { current, base: current, outbox: [], redo: [] },
    displayCurrency: null,
    isPending: false,
    lastSync: { finishedAt: 0, isSuccessful: null, errorMessage: null },
    token: null,
    ...overrides,
  }
}
