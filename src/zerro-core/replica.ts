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
  getMaterializedOutboxPatches,
  redoOutbox,
  replayOutbox,
  undoOutbox,
  undoOutboxTo,
  type TCommand,
  type TOutboxState,
} from './internal/operations/replication/outbox'

export { applyPatch } from './internal/domain/zenmoney/model/applyPatch'

export {
  dataStoreValidatorVersion,
  validateDataStore,
  type TDataStoreValidationResult,
} from './internal/domain/zenmoney/model/validateStore'

export {
  acceptCanonicalPatch,
  type TAcceptedCanonicalPatch,
} from './internal/operations/replication/canonical'

export {
  applyCompactTransition,
  appendCanonicalJournalPoint,
  compactCanonicalTransition,
  compactJournalBranchAt,
  compactJournalAt,
  createJournalBranch,
  defaultJournalRetentionPolicy,
  estimateJournalBytes,
  listJournalHistory,
  replayJournal,
  replayJournalBranch,
  replayJournalPoint,
  retainJournal,
  type TCompactCanonicalTransition,
  type TCompactDeletion,
  type TCompactEntityChange,
  type TJournalBranch,
  type TJournalCollection,
  type TJournalPoint,
  type TJournalPointRef,
  type TJournalHistoryEntry,
  type TJournalRetentionPolicy,
  type TJournalRetentionResult,
  type TJournalValidationStatus,
} from './internal/operations/replication/journal'

export {
  isEmptyChangeSummary,
  summarizeCanonicalTransition,
  summarizeNormalizedPatch,
  type TChangeCounts,
  type TChangeSummary,
} from './internal/operations/replication/changeSummary'

export {
  journalPersistenceVersion,
  parsePersistedJournal,
  type TPersistedJournal,
} from './runtime/persistence/journalPersistence'

export { getSyncCursor } from './internal/operations/replication/cursor'

export { createEmptyDataStore } from './internal/domain/zenmoney/model/store'

export {
  parsePersistedReplica,
  replicaPersistenceVersion,
  type TPersistedReplica,
} from './runtime/persistence/persistence'
