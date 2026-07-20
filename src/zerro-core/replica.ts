/**
 * Current-app integration seam for the command replica.
 *
 * Consumers import this entrypoint rather than implementation paths. The pure
 * operations and persistence parser remain independently owned internally and
 * may move without changing the app boundary.
 */
export {
  appendOutbox,
  applyOutboxCommand,
  buildOutboxTransport,
  clampOutboxHead,
  getMaterializedOutboxPatches,
  getPendingOutbox,
  replayOutbox,
  type TCommand,
  type TOutboxState,
} from './internal/operations/replication/outbox'

export {
  parsePersistedReplica,
  replicaPersistenceVersion,
  type TPersistedReplica,
} from './runtime/persistence/persistence'
