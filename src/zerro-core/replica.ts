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
  parseCommandOutbox,
  redoOutbox,
  replayOutbox,
  undoOutbox,
  undoOutboxTo,
  type TCommand,
  type TOutboxState,
} from './internal/operations/replication/outbox'

export {
  commandVerbs,
  sanitizeCommandLabel,
  type TCommandLabel,
  type TCommandLabelArgs,
  type TCommandVerb,
} from './internal/operations/materialization'

export { applyPatch } from './internal/domain/zenmoney/model/applyPatch'

export {
  eachReferenceIssue,
  entityCleanupOrder,
  entityProgressOrder,
  entityUpsertOrder,
  isAbsentRow,
  isRowWritable,
  clearAbsentReferences,
  type TReferenceIssue,
  type TRowPresence,
} from './internal/domain/zenmoney/model/entityGraph'

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
  compactCanonicalTransition,
  type TCompactCanonicalTransition,
  type TCompactDeletion,
  type TCompactEntityChange,
} from './internal/operations/replication/journal'

export {
  compactJournalEntries,
  createCheckpointEntry,
  createTransitionEntry,
  replayJournalEntries,
  type TCheckpointEntry,
  type TCheckpointReason,
  type TJournalEntry,
  type TTransitionEntry,
} from './internal/operations/replication/linearJournal'

export {
  isEmptyChangeSummary,
  summarizeCanonicalTransition,
  summarizeNormalizedPatch,
  type TChangeCounts,
  type TChangeSummary,
  type TChangeSummaryKey,
} from './internal/operations/replication/changeSummary'

export { getSyncCursor } from './internal/operations/replication/cursor'

export {
  DEFAULT_PUSH_RETRY_POLICY,
  drivePush,
  isRetryablePushStatus,
  type TPushCommitResult,
  type TPushDriverPorts,
  type TPushEvent,
  type TPushOutcome,
  type TPushRetryPolicy,
  type TPushSendResult,
} from './internal/operations/replication/pushDriver'

export {
  DEFAULT_PUSH_MAX_BYTES,
  acceptPushChunk,
  beginPush,
  shrinkPushChunk,
  type TAcceptedPushChunk,
  type TPreparedPush,
  type TPushMeasure,
  type TPushProgressRow,
  type TPushRun,
} from './internal/operations/replication/pushRun'

export { createEmptyDataStore } from './internal/domain/zenmoney/model/store'

export { getRootUserId } from './internal/domain/zenmoney/entities/users'
