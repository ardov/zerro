/**
 * Reading a full backup file back into the app.
 *
 * The file format is the export format, so nothing new is defined here: a
 * backup is a complete ZenMoney diff, and importing it means diffing the store
 * it describes against the current one. The result is an ordinary command, so
 * the import lands in the outbox, is undoable, and is only sent on a manual
 * sync like any other change.
 */
import { track } from '6-shared/analytics'
import { convertDiff } from '6-shared/api/zm-adapter'
import type { TDataStore, TZmDiff } from '6-shared/types'
import type { AppThunk } from 'store'
import { core } from 'zerro-core/redux'

export type TBackupParseResult =
  | { ok: true; store: TDataStore }
  | { ok: false; reason: 'unreadable' | 'notABackup' }

/** Entity arrays a backup may carry. A file with none of them is not one. */
const backupKeys = [
  'instrument',
  'country',
  'company',
  'user',
  'merchant',
  'account',
  'tag',
  'budget',
  'reminder',
  'reminderMarker',
  'transaction',
] as const satisfies readonly (keyof TZmDiff)[]

export function parseBackup(text: string): TBackupParseResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, reason: 'unreadable' }
  }

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, reason: 'notABackup' }
  }

  const file = raw as Record<string, unknown>
  const present = backupKeys.filter(key => file[key] !== undefined)
  if (!present.length) return { ok: false, reason: 'notABackup' }
  if (present.some(key => !Array.isArray(file[key]))) {
    return { ok: false, reason: 'notABackup' }
  }

  try {
    return {
      ok: true,
      store: core.restore.toStore(convertDiff.toClient(file as TZmDiff)),
    }
  } catch {
    return { ok: false, reason: 'notABackup' }
  }
}

/** What importing this backup would change, without changing anything. */
export function previewBackup(
  backup: TDataStore
): AppThunk<core.restore.TStoreDiffSummary> {
  return (_, getState) => core.restore.preview(getState(), backup)
}

export function importBackup(backup: TDataStore): AppThunk {
  return dispatch => {
    track('data_backup_imported', {})
    dispatch(core.restore.apply(backup))
  }
}
