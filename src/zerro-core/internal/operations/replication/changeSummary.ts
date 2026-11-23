import {
  dataEntityKeys,
  type TDataEntityKey,
  type TNormalizedPatch,
} from '../../domain/zenmoney'
import { isZerroDataAccount } from '../../domain/zerro/accounts'
import {
  hiddenDataSummaryKeys,
  parseHiddenDataComment,
  type THiddenDataSummaryKey,
} from '../../domain/zerro/hidden-data'
import type { TCompactCanonicalTransition } from './journal'

export type TChangeSummaryKey = TDataEntityKey | THiddenDataSummaryKey

export type TChangeCounts = {
  changed: number
  removed: number
}

/** Count hidden-data records without replaying history here. Details can count individual entries from both snapshots. */
export type TChangeSummary = Partial<Record<TChangeSummaryKey, TChangeCounts>>

export function summarizeCanonicalTransition(
  transition: TCompactCanonicalTransition
): TChangeSummary {
  const summary: TChangeSummary = {}

  dataEntityKeys.forEach(object => {
    transition.upsert?.[object]?.forEach(change => {
      // A canonical transition carries changed fields only; classify hidden data when the payload itself changed.
      countRow(summary, object, change.fields)
    })
  })
  transition.deletion?.forEach(({ object }) => count(summary, object, true))

  return summary
}

export function summarizeNormalizedPatch(
  patch: TNormalizedPatch
): TChangeSummary {
  const summary: TChangeSummary = {}

  dataEntityKeys.forEach(object => {
    patch[object]?.forEach(row => {
      countRow(summary, object, row)
    })
  })
  patch.deletion?.forEach(({ object }) => {
    if (isDataEntityKey(object)) count(summary, object, true)
  })

  return summary
}

export function isEmptyChangeSummary(summary: TChangeSummary): boolean {
  return !Object.keys(summary).length
}

/** Report soft deletes as removals even though their rows remain stored. */
function isRemoval(fields: object): boolean {
  return (fields as { deleted?: unknown }).deleted === true
}

function countRow(
  summary: TChangeSummary,
  object: TDataEntityKey,
  fields: object
): void {
  const key = summaryKeyFor(object, fields)
  if (key) count(summary, key, isRemoval(fields))
}

/** Hide Zerro's storage account from change counts. ID-only deletions cannot be classified by title.
 * An unreadable hidden payload falls back to a normal reminder. */
function summaryKeyFor(
  object: TDataEntityKey,
  fields: object
): TChangeSummaryKey | null {
  if (object === 'account') return isZerroDataAccount(fields) ? null : object
  if (object !== 'reminder') return object
  const comment = (fields as { comment?: unknown }).comment
  if (typeof comment !== 'string') return object
  const hidden = parseHiddenDataComment(comment)
  return hidden ? hiddenDataSummaryKeys[hidden.type] : object
}

function count(
  summary: TChangeSummary,
  key: TChangeSummaryKey,
  removed: boolean
): void {
  const counts = (summary[key] ??= { changed: 0, removed: 0 })
  if (removed) counts.removed += 1
  else counts.changed += 1
}

function isDataEntityKey(object: string): object is TDataEntityKey {
  return (dataEntityKeys as readonly string[]).includes(object)
}
