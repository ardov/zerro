import type { RootState } from 'store'
import { applyPatch } from '../../internal/domain/zenmoney/model/applyPatch'
import {
  createEmptyDataStore,
  type TDataStore,
  type TNormalizedPatch,
} from '../../internal/domain/zenmoney/model/store'
import {
  diffStores,
  summarizeStoreDiff,
  type TStoreDiffScope,
  type TStoreDiffSummary,
} from '../../internal/operations/restore/diffStores'
import { selectData } from './state'

/**
 * Reads a full backup as the store it describes. The backup format is the
 * export format: a complete normalized patch over an empty store.
 */
export function toStore(backup: TNormalizedPatch): TDataStore {
  return applyPatch(createEmptyDataStore(), backup)
}

/**
 * What `apply` would write, counted per entity type. Restoring overwrites
 * concurrent changes inside its scope, so this is what a confirmation has to
 * show before the command is issued.
 */
export function preview(
  state: RootState,
  desired: TDataStore,
  scope?: TStoreDiffScope
): TStoreDiffSummary {
  const current = selectData(state)
  return summarizeStoreDiff(current, diffStores(current, desired, scope))
}

export { restoreDataStore as apply } from './commands'
export type {
  TStoreDiffCounts,
  TStoreDiffScope,
  TStoreDiffSummary,
} from '../../internal/operations/restore/diffStores'
