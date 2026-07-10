/**
 * Public surface of the Redux adapter.
 *
 * Only selectors that real app consumers read belong here — add an export when
 * a consumer switches, not in advance. Everything else in `./selectors` is
 * internal graph wiring (memoization nodes) or is exported there solely for
 * adapter parity tests, and must not leak through this entrypoint.
 */
export { applyLegacyPatch } from './legacyPatch'
export {
  compileAppCommand,
  executeCommand,
  type TAppCommand,
} from './commands'
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
