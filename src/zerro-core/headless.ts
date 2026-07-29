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

export type { TCompiled, TCoreContext } from './types'
