import type { TNormalizedPatch } from '../types'
import type { TDataStore } from '../zenmoney/store'

/**
 * Version of the local ZenMoney rule set used to materialize intent patches.
 * Persisted outbox entries keep this value next to the applied patch so replay
 * never needs to reinterpret historical intent with a newer rule set.
 */
export const materializerVersion = 1

export type TMaterializedPatch = {
  /** Primary changes requested by a command or a legacy local write. */
  intentPatch: TNormalizedPatch

  /** Complete deterministic patch used by local apply and outbox replay. */
  appliedPatch: TNormalizedPatch

  /** Rule-set version that produced appliedPatch. */
  materializerVersion: number
}

/**
 * Expands a local intent patch with ZenMoney-compatible domain effects.
 *
 * The materializer is intentionally an identity layer for now: legacy Zerro
 * applied local patches exactly as they were compiled. Keeping the layer in
 * the execution pipeline lets us add the known server-like rules in one place
 * instead of duplicating them across command compilers.
 *
 * Future rules recorded for this layer:
 *
 * - Changing a transaction amount must update the balances of the affected
 *   income and outcome accounts.
 * - Deleting an account must permanently delete its non-transfer transactions.
 * - Transfers involving a deleted account must survive as income or outcome on
 *   the remaining account rather than being deleted.
 * - A transaction that is already marked `deleted` stays deleted; subsequent
 *   patches must not change it.
 *
 * Canonical server diffs must bypass this function and go directly through the
 * dumb patch applier: ZenMoney may already have materialized the same effects.
 */
export function materializePatch(
  snapshot: TDataStore,
  intentPatch: TNormalizedPatch
): TMaterializedPatch {
  // The snapshot becomes an input to the rules above. Referencing it now keeps
  // the future contract explicit without changing legacy identity behavior.
  void snapshot

  return {
    intentPatch,
    appliedPatch: intentPatch,
    materializerVersion,
  }
}
