import type { TOutboxEntry } from './outbox'

export const replicaPersistenceVersion = 1 as const

export type TPersistedReplica = {
  version: typeof replicaPersistenceVersion
  baseServerTimestamp: number
  outbox: TOutboxEntry<unknown>[]
  outboxHead: number
}
