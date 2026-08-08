/**
 * Counting what a change touched, per entity type.
 *
 * The history list needs to say what a row did without replaying anything: a
 * journal point already stores its own compact transition, and an outbox
 * command already materializes into a patch. Both shapes are "rows per entity
 * key plus a deletion list", so both reduce to the same counts here.
 */
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

/**
 * Counts of changed rows, per type. A hidden-data key counts the monthly
 * records that changed, not the envelopes inside them — which envelope moved
 * needs the payload before the change, and the row is built without replaying
 * anything. That belongs to the detail view, where the point is replayed
 * regardless.
 */
export type TChangeSummary = Partial<Record<TChangeSummaryKey, TChangeCounts>>

/** What a canonical journal point changed against the point before it. */
export function summarizeCanonicalTransition(
  transition: TCompactCanonicalTransition
): TChangeSummary {
  const summary: TChangeSummary = {}

  dataEntityKeys.forEach(object => {
    transition.upsert?.[object]?.forEach(change => {
      // A transition carries only changed fields, so a hidden-data reminder
      // is recognizable exactly when its payload is what changed — which is
      // the case this exists for.
      countRow(summary, object, change.fields)
    })
  })
  transition.deletion?.forEach(({ object }) => count(summary, object, true))

  return summary
}

/** What one materialized command writes. */
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

/**
 * A soft delete reads as a removal, not an edit. Transactions are never
 * dropped from the store — the domain flips `deleted` — so counting that as a
 * change would report "1 transaction changed" for the one operation a user is
 * most likely to be looking for in their history.
 */
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

/**
 * The type a changed row is reported under: its own, unless it is a reminder
 * carrying Zerro's own state — or `null` for a row no user ever asked for.
 *
 * The one such row is the account hidden data is stored under. Every write of
 * a goal or a budget goes through `compileEnsureZerroDataAccount`, so without
 * this a goal edit reports "Goals 1 · Accounts 1" and invites its reader to go
 * looking for an account change that never happened. This is the same fix
 * `hiddenDataSummaryKeys` makes for the reminders themselves.
 *
 * Recognition is by title and therefore one-sided: a deletion entry carries an
 * id and nothing else, so a data account that goes away is still counted as an
 * account, and no stored transition holds what would close that gap. The leak
 * this exists for is the other direction — the account is ensured on every
 * goal and budget write, and a creation carries every field, title included.
 *
 * A payload that fails to parse falls back to `reminder` rather than throwing
 * — a comment this code cannot read is still a reminder that changed, and a
 * history list must not be the thing that breaks on unfamiliar data.
 */
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
