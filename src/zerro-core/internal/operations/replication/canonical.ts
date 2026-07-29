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
 * A refresh omits `sentOutboxCount` and therefore preserves every pending
 * command. A successful sync acknowledges exactly the captured sent prefix;
 * commands appended while the request was in flight remain pending.
 */
export function acceptCanonicalPatch(
  replica: {
    base: TDataStore
    outbox: readonly TCommand[]
  },
  canonicalPatch: TNormalizedPatch,
  sentOutboxCount?: number
): TAcceptedCanonicalPatch {
  const base = applyPatch(replica.base, canonicalPatch)
  const outbox =
    sentOutboxCount === undefined
      ? [...replica.outbox]
      : replica.outbox.slice(sentOutboxCount)

  return {
    base,
    current: replayOutbox(base, outbox),
    outbox,
    redo: [],
  }
}
