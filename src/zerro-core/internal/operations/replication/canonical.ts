import {
  applyPatch,
  type TDataStore,
  type TNormalizedPatch,
} from '../../domain/zenmoney'
import type { TCommand } from '../materialization'
import { replayOutbox } from './outbox'

export type TAcceptedCanonicalPatch = {
  base: TDataStore
  current: TDataStore
  outbox: TCommand[]
  redo: TCommand[]
}

/**
 * Accepts one canonical server patch over a durable `base + outbox` replica.
 *
 * This is the pull half of replication and acknowledges nothing: every pending
 * command rebases over the new base. Acknowledging sent work belongs to a Push
 * run, which retires exact item receipts Chunk by Chunk — see `pushRun`.
 */
export function acceptCanonicalPatch(
  replica: {
    base: TDataStore
    outbox: readonly TCommand[]
    redo?: readonly TCommand[]
  },
  canonicalPatch: TNormalizedPatch
): TAcceptedCanonicalPatch {
  const base = applyPatch(replica.base, canonicalPatch)
  const outbox = [...replica.outbox]

  return {
    base,
    current: replayOutbox(base, outbox),
    outbox,
    // A pull commits nothing and is only a rebase, which leaves the redo stack
    // valid: an undone command is by definition one that was never sent, and
    // it is an absolute patch, so redoing it replays over the new base exactly
    // like any pending command.
    redo: [...(replica.redo ?? [])],
  }
}
