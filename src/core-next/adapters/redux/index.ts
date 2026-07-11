/**
 * Public surface of the Redux adapter.
 *
 * Only selectors that real app consumers read belong here — add an export when
 * a consumer switches, not in advance. Everything else in `./selectors` is
 * internal graph wiring (memoization nodes) or is exported there solely for
 * adapter parity tests, and must not leak through this entrypoint.
 */
export {
  applyChangesToTransaction,
  applyEnvelopeStructure,
  bulkEditTransactions,
  combineTransactionsToIncome,
  combineTransactionsToOutcome,
  createEnvelope,
  deleteTransactions,
  deleteTransactionsPermanently,
  executeCommand,
  mergeAccounts,
  mergeTransactionsAsTransfer,
  recreateTransaction,
  renameEnvelope,
  restoreTransaction,
  setAccountInBalance,
  setEnvelopeColor,
  setEnvelopeComment,
  setTransactionsViewed,
  updateEnvelopeSettings,
  type TAppCommand,
} from './commands'
export {
  toEnvelopeStructureInput,
  type TApplyEnvelopeStructureInput,
  type TEnvelopeStructureGroupInput,
  type TEnvelopeStructureNodeInput,
} from '../../zerro'
export {
  selectCoreActivity,
  selectCoreBalancesByDate,
  selectCoreBudgets,
  selectCoreEnvelopes,
  selectCoreEnvelopeStructure,
  selectCoreEnvMetrics,
  selectCoreGoals,
  selectCoreGoalTotals,
  selectCoreHistoryStart,
  selectCoreKeepingEnvelopeIds,
  selectCoreMonthList,
  selectCoreMonthTotals,
  selectCorePopulatedTags,
  selectCoreRawActivity,
  selectCoreSortedActivity,
  selectCoreDebtors,
  selectCoreTransactionIds,
  selectCoreTransactions,
  selectCoreTransactionsHistory,
} from './selectors'
