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
import type { TCompactCanonicalTransition } from './journal'

export type TChangeCounts = {
  changed: number
  removed: number
}

export type TChangeSummary = Partial<Record<TDataEntityKey, TChangeCounts>>

/** What a canonical journal point changed against the point before it. */
export function summarizeCanonicalTransition(
  transition: TCompactCanonicalTransition
): TChangeSummary {
  const summary: TChangeSummary = {}

  dataEntityKeys.forEach(object => {
    transition.upsert?.[object]?.forEach(change => {
      count(summary, object, isRemoval(change.fields))
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
      count(summary, object, isRemoval(row))
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

function count(
  summary: TChangeSummary,
  object: TDataEntityKey,
  removed: boolean
): void {
  const counts = (summary[object] ??= { changed: 0, removed: 0 })
  if (removed) counts.removed += 1
  else counts.changed += 1
}

function isDataEntityKey(object: string): object is TDataEntityKey {
  return (dataEntityKeys as readonly string[]).includes(object)
}
