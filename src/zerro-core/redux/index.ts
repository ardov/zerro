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
export type { TPresentedEnvelope } from './envelopePresentation'
export { formatGoal } from './goalPresentation'
export {
  useCoreDisplayCurrency,
  useCoreToDisplay,
  useCoreTransactionType,
  useCoreAccounts,
  useCoreInBudgetAccounts,
  useCorePopulatedAccounts,
  useCoreSavingAccounts,
  useCoreInstruments,
  useCoreInstrumentsByCode,
  useCoreInstCodeMap,
  useCoreMerchants,
  useCoreRootUserId,
  useCoreUserCurrency,
  useCoreUserInstrumentId,
  useCoreUserSettings,
} from './hooks'
// Narrow pure domain helpers used by real app consumers. Keep the underlying
// ZenMoney/Zerro implementation barrels internal.
export {
  compareTransactionDates,
  getTransactionType,
  isDeletedTransaction,
  isTransactionViewed,
  TrType,
  type TAccountPopulated,
  type TDebtor,
} from '../domain/zenmoney'
export {
  checkRaw as compileTransactionFilter,
  type TrCondition,
} from '5-entities/transaction/filtering'
export { goalType, normalizeGoal, type TGoal } from '../domain/zerro/goals'
export type { TGoalInfo } from '../domain/zerro/goals'
export { type TFxRates } from '../domain/zerro/fx-rates'
export {
  envId,
  EnvActivity,
  EnvType,
  flattenStructure,
  TrFilterMode,
  toEnvelopeStructureInput,
  type TEnvMetrics,
  type TEnvNode,
  type TGroupNode,
  type TMonthTotals,
  type TSortedActivityNode,
  type TApplyEnvelopeStructureInput,
  type TEnvelopeStructureGroupInput,
  type TEnvelopeStructureNodeInput,
} from '../domain/zerro'
export {
  selectCoreActivity,
  selectCoreAccountList,
  selectCoreAccounts,
  selectCoreBalancesByDate,
  selectCoreBudgets,
  selectCoreCurrentFxRates,
  selectCoreDebtAccountId,
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
  selectCoreInBudgetAccounts,
  selectCoreInstruments,
  selectCoreInstrumentsByCode,
  selectCoreInstCodeMap,
  selectCoreKeepingEnvelopeIds,
  selectCoreMonthList,
  selectCoreMonthTotals,
  selectCoreMerchants,
  selectCoreRootUser,
  selectCoreRootUserId,
  selectCorePopulatedTags,
  selectCoreRawActivity,
  selectCorePopulatedAccounts,
  selectCoreSavingAccounts,
  selectCoreSortedActivity,
  selectCoreDebtors,
  selectCoreTransactionIds,
  selectCoreTransactions,
  selectCoreTransactionsHistory,
  selectCoreUserCurrency,
  selectCoreUserInstrumentId,
  selectCoreUserSettings,
} from './selectors'
