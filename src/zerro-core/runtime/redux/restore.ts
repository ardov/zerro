import type { RootState } from 'store'
import type { TDataStore } from '../../internal/domain/zenmoney/model/store'
import {
  diffStores,
  summarizeStoreDiff,
  type TStoreDiffSummary,
} from '../../internal/operations/restore/diffStores'
import {
  checkBackupCompatibility as checkStoreBackupCompatibility,
  type TBackupCompatibilityResult,
} from '../../internal/operations/restore/backupCompatibility'
import { selectData } from './state'

/**
 * What `apply` would write, counted per entity type. Restoring overwrites
 * concurrent changes inside its scope, so this is what a confirmation has to
 * show before the command is issued.
 */
export function preview(
  state: RootState,
  desired: TDataStore
): TStoreDiffSummary {
  const current = selectData(state, 'live')
  return summarizeStoreDiff(current, diffStores(current, desired))
}

/** Validates a decoded backup against the currently signed-in account. */
export function checkBackupCompatibility(
  state: RootState,
  backup: TDataStore
): TBackupCompatibilityResult {
  return checkStoreBackupCompatibility(selectData(state, 'live'), backup)
}

export { restoreDataStore as apply } from './commands'
export type {
  TStoreDiffCounts,
  TStoreDiffSummary,
} from '../../internal/operations/restore/diffStores'
export type { TBackupCompatibilityResult }
