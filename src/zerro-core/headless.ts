/**
 * Narrow source boundary for non-Redux local consumers.
 *
 * This entrypoint composes existing Core capabilities; it owns no state,
 * persistence, network, CLI, or MCP behavior.
 */
export {
  createZerroSession,
  type TZerroSession,
} from './public/session/createZerroSession'

export {
  createEmptyDataStore,
  type TDataStore,
  type TIntentPatch,
  type TNormalizedPatch,
} from './internal/domain/zenmoney/model/store'

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
  validateDataStore,
  type TDataStoreValidationResult,
} from './internal/domain/zenmoney/model/validateStore'

export {
  compileCreatePosting,
  compileCreateTransfer,
  type TCreateTransactionData,
  type TCreateMerchantReference,
  type TCreatePostingInput,
  type TCreateTransferInput,
  type TCreateTransactionReceipt,
  type TOriginalAmount,
} from './internal/domain/zenmoney/entities/transactions/commands'

export {
  compileTransactionQuery,
  TrFilterMode,
  TrFilterType,
  type TTransactionFilterClause,
  type TTransactionQuery,
  type TTransactionQueryContext,
} from './internal/domain/zerro/transactions/query'

export {
  routeTransactionToActivity,
  type TTransactionActivityRoute,
  type TTransactionActivityRoutingContext,
} from './internal/domain/zerro/activity/transactionRouting'

export {
  issuePatch,
  type TCommand,
} from './internal/operations/materialization'

export {
  appendOutbox,
  applyOutboxCommand,
  buildOutboxTransport,
  getMaterializedOutboxPatches,
  parseCommandOutbox,
  redoOutbox,
  replayOutbox,
  stageCompiledCommand,
  undoOutbox,
  type TOutboxState,
  type TStagedCompiledCommand,
} from './internal/operations/replication/outbox'

export {
  compileSetBudget,
  type TBudgetUpdate,
} from './internal/domain/zerro/budgets/commands'

export {
  acceptCanonicalPatch,
  type TAcceptedCanonicalPatch,
} from './internal/operations/replication/canonical'

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

export type { TCompiled, TCoreContext } from './types'
