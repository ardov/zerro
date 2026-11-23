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

/** A pull rebases pending commands without acknowledging them. Push retires exact item receipts per chunk. */
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
    // Redo only contains unsent commands, so a pull leaves them replayable over the new base.
    redo: [...(replica.redo ?? [])],
  }
}
