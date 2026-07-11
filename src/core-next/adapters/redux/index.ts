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
  applyDebugPatch,
  applyEnvelopeStructure,
  bulkEditTransactions,
  combineTransactionsToIncome,
  combineTransactionsToOutcome,
  createEnvelope,
  deleteTransactions,
  deleteTransactionsPermanently,
  deleteReminder,
  editFxRates,
  mergeAccounts,
  mergeTransactionsAsTransfer,
  prepareDataAccount,
  recreateTransaction,
  resetFxRates,
  renameEnvelope,
  restoreTransaction,
  setAccountInBalance,
  setEnvelopeColor,
  setEnvelopeComment,
  setEmojiIcons,
  setPreferZmBudgets,
  setReminder,
  setBudget,
  setGoal,
  setTransactionsViewed,
  type TBudgetUpdate,
  updateEnvelopeSettings,
} from './commands'
export { nullTag, populateTags, type TTagPopulated } from './tagPresentation'
export { useCoreToDisplay } from './hooks'
// Narrow pure domain helpers used by real app consumers. Keep the underlying
// ZenMoney/Zerro implementation barrels internal.
export { getTransactionType, TrType } from '../../zenmoney'
export { goalType, normalizeGoal } from '../../zerro/goals'
export { type TFxRates } from '../../zerro/fx-rates'
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
  selectCoreCurrentFxRates,
  selectCoreConvertFx,
  selectCoreDisplayConverter,
  selectCoreDisplayCurrency,
  selectCoreEnvelopes,
  selectCoreEnvelopeStructure,
  selectCoreEnvMetrics,
  selectCoreFxRatesGetter,
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
