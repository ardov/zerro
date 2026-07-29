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

export {
  compileCreateTransaction,
  type TCreateTransactionData,
  type TCreateTransactionInput,
  type TCreateTransactionReceipt,
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
  issuePatch,
  type TCommand,
} from './internal/operations/materialization'

export {
  appendOutbox,
  applyOutboxCommand,
  buildOutboxTransport,
  getMaterializedOutboxPatches,
  redoOutbox,
  replayOutbox,
  undoOutbox,
  type TOutboxState,
} from './internal/operations/replication/outbox'

export {
  acceptCanonicalPatch,
  type TAcceptedCanonicalPatch,
} from './internal/operations/replication/canonical'

export { getSyncCursor } from './internal/operations/replication/cursor'

export {
  parsePersistedReplica,
  replicaPersistenceVersion,
  type TPersistedReplica,
} from './runtime/persistence/persistence'

export type { TCompiled, TCoreContext } from './types'
