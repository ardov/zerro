/** A backup is a full Zenmoney diff. Import applies the difference as an undoable local command. */
import { track } from '@/6-shared/analytics'
import type { TDataStore } from '@/6-shared/types'
import type { AppThunk } from '@/store'
import { core } from '@/zerro-core/redux'

export type TImportBackupResult =
  | { ok: true; applied: boolean }
  | {
      ok: false
      reason: 'incompatibleBackup' | 'invalidCurrentState'
    }

export function checkBackupCompatibility(
  backup: TDataStore
): AppThunk<core.restore.TBackupCompatibilityResult> {
  return (_, getState) =>
    core.restore.checkBackupCompatibility(getState(), backup)
}

export function previewBackup(
  backup: TDataStore
): AppThunk<core.restore.TStoreDiffSummary> {
  return (_, getState) => core.restore.preview(getState(), backup)
}

export function importBackup(
  backup: TDataStore
): AppThunk<TImportBackupResult> {
  return (dispatch, getState) => {
    const compatibility = core.restore.checkBackupCompatibility(
      getState(),
      backup
    )
    if (!compatibility.ok) return compatibility

    const applied = dispatch(core.restore.apply(backup))
    if (applied) {
      track('data_backup_imported', { foreign: compatibility.foreign })
    }
    return { ok: true, applied }
  }
}
