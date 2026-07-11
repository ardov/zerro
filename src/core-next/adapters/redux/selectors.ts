import { createSelector } from '@reduxjs/toolkit'
import { shallowEqual } from 'react-redux'
import { toISODate, toISOMonth } from '6-shared/helpers/date'
import { i18n } from '6-shared/localization'
import { ZERRO_DATA_ACCOUNT_NAME } from '../../constants'
import { getSavedCurrency } from 'store/displayCurrency'
import { userModel } from '5-entities/user'
import type { RootState } from 'store'
import {
  buildBalances,
  buildBalancesByDate,
  buildDebtors,
  buildTagStructure,
  convertBalancesToDisplay,
  getHistoryStart,
  getDebtAccountId,
  getAccounts,
  getInstruments,
  getInstrumentsByCode,
  getInstCodeMap,
  getMerchants,
  getPopulatedAccounts,
  getTagBudgets,
  getTransactionIds,
  getTransactions,
  getTransactionsHistory,
} from '../../zenmoney'
import {
  buildActivity,
  buildBudgets,
  buildCurrentFxRates,
  buildCurrentFunds,
  buildEnvelopes,
  buildEnvMetrics,
  buildFxConverter,
  buildFxRates,
  buildFxRatesGetter,
  buildMonthList,
  buildMonthTotals,
  buildGoals,
  buildGoalTotals,
  buildRawActivity,
  buildSortedActivity,
  getEnvBudgets,
  getEnvelopeMeta,
  getZerroInBudgetAccountIds,
  getZerroSavingAccounts,
  getStoredFxRates,
  getRawGoals,
  getKeepingEnvelopes,
  getUserSettings,
} from '../../zerro'
import { presentEnvelopes, type TEnvelopeLabels } from './envelopePresentation'
import { presentTags } from './tagPresentation'

// Hidden data lives only in reminder comments; depending on the reminder slice
// keeps these selectors cached across unrelated data changes.
const selectCoreReminderSlice = (state: RootState) =>
  state.data.current.reminder

const selectCoreTagBudgetSlice = (state: RootState) => state.data.current.budget

const selectCoreAccountSlice = (state: RootState) => state.data.current.account

const selectCoreInstrumentSlice = (state: RootState) =>
  state.data.current.instrument

const selectCoreMerchantSlice = (state: RootState) =>
  state.data.current.merchant

export const selectCoreInstruments = (state: RootState) =>
  getInstruments({ instrument: selectCoreInstrumentSlice(state) })

export const selectCoreInstCodeMap = createSelector(
  [selectCoreInstrumentSlice],
  instrument => getInstCodeMap({ instrument })
)

export const selectCoreInstrumentsByCode = createSelector(
  [selectCoreInstrumentSlice],
  instrument => getInstrumentsByCode({ instrument })
)

export const selectCoreMerchants = (state: RootState) =>
  getMerchants({ merchant: selectCoreMerchantSlice(state) })

export const selectCoreDebtAccountId = createSelector(
  [selectCoreAccountSlice],
  account => getDebtAccountId({ account })
)

export const selectCoreAccounts = (state: RootState) =>
  getAccounts({ account: selectCoreAccountSlice(state) })

export const selectCorePopulatedAccounts = createSelector(
  [selectCoreAccountSlice, selectCoreInstCodeMap],
  (account, instrumentCodeById) =>
    getPopulatedAccounts({ account }, instrumentCodeById)
)

export const selectCoreAccountList = createSelector(
  [selectCorePopulatedAccounts],
  accounts => Object.values(accounts)
)

export const selectCoreInBudgetAccounts = createSelector(
  [selectCoreAccountList],
  accounts => accounts.filter(account => account.inBudget)
)

export const selectCoreSavingAccounts = createSelector(
  [selectCoreAccountList],
  accounts =>
    accounts.filter(
      account =>
        !account.inBudget &&
        account.type !== 'debt' &&
        account.title !== ZERRO_DATA_ACCOUNT_NAME
    )
)

const selectCoreTagSlice = (state: RootState) => state.data.current.tag

// Transaction-heavy projections depend only on this slice. Keep the history
// transform in the Core entity layer instead of borrowing the legacy selector.
const selectCoreTransactionSlice = (state: RootState) =>
  state.data.current.transaction

export const selectCoreTransactions = (state: RootState) =>
  getTransactions({ transaction: selectCoreTransactionSlice(state) })

export const selectCoreTransactionIds = createSelector(
  [selectCoreTransactions],
  transaction => getTransactionIds({ transaction })
)

export const selectCoreTransactionsHistory = createSelector(
  [selectCoreTransactions],
  transaction => getTransactionsHistory({ transaction })
)

export const selectCoreUserSettings = createSelector(
  [selectCoreReminderSlice],
  reminder => getUserSettings({ reminder })
)

export const selectCoreTagStructure = createSelector(
  [selectCoreTagSlice],
  tags => buildTagStructure({ tags })
)

export const selectCorePopulatedTags = createSelector(
  [selectCoreTagStructure, selectCoreUserSettings],
  presentTags
)

const selectCoreEnvelopeMeta = createSelector(
  [selectCoreReminderSlice],
  reminder => getEnvelopeMeta({ reminder })
)

const selectCoreEnvBudgets = createSelector(
  [selectCoreReminderSlice],
  reminder => getEnvBudgets({ reminder })
)

export const selectCoreRawGoals = createSelector(
  [selectCoreReminderSlice],
  reminder => getRawGoals({ reminder })
)

const selectCoreStoredFxRates = createSelector(
  [selectCoreReminderSlice],
  reminder => getStoredFxRates({ reminder })
)

export const selectCoreEnvelopeLabels = () => getCoreEnvelopeLabels()

export const selectCoreDebtors = createSelector(
  [
    selectCoreTransactionsHistory,
    selectCoreMerchants,
    selectCoreInstruments,
    selectCoreDebtAccountId,
  ],
  (transactions, merchants, instruments, debtAccountId) =>
    buildDebtors({
      transactions,
      merchants,
      instruments,
      debtAccountId,
    })
)

const selectCoreDomainEnvelopeProjection = createSelector(
  [
    selectCoreDebtors,
    selectCoreTagStructure,
    selectCoreAccountSlice,
    selectCoreEnvelopeMeta,
    userModel.getUserCurrency,
  ],
  (debtors, tags, account, envelopeMeta, userCurrency) =>
    buildEnvelopes({
      debtors,
      tags,
      savingAccounts: getZerroSavingAccounts({ account }),
      envelopeMeta,
      userCurrency,
    })
)

export const selectCoreDomainEnvelopes = (state: RootState) =>
  selectCoreDomainEnvelopeProjection(state).byId

export const selectCoreDomainEnvelopeStructure = (state: RootState) =>
  selectCoreDomainEnvelopeProjection(state).structure

const selectCorePresentedEnvelopeProjection = createSelector(
  [
    selectCoreDomainEnvelopeProjection,
    selectCorePopulatedTags,
    selectCoreEnvelopeLabels,
  ],
  (compiled, tags, labels) => presentEnvelopes(compiled.byId, tags, labels)
)

export const selectCoreEnvelopes = (state: RootState) =>
  selectCorePresentedEnvelopeProjection(state).byId

export const selectCoreEnvelopeStructure = (state: RootState) =>
  selectCorePresentedEnvelopeProjection(state).structure

export const selectCoreKeepingEnvelopeIds = createSelector(
  [selectCoreDomainEnvelopes],
  getKeepingEnvelopes
)

export const selectCoreBudgets = createSelector(
  [selectCoreTagBudgetSlice, selectCoreEnvBudgets, selectCoreUserSettings],
  (budget, envBudgets, userSettings) =>
    buildBudgets({
      tagBudgets: getTagBudgets({ budget }),
      envBudgets,
      preferZmBudgets: userSettings.preferZmBudgets,
    })
)

const selectCoreCurrentMonth = () => toISOMonth(Date.now())

const selectCoreCurrentDate = () => toISODate(Date.now())

export const selectCoreCurrentFxRates = createSelector(
  [selectCoreInstruments, selectCoreCurrentMonth],
  (instruments, currentMonth) =>
    buildCurrentFxRates({
      instruments,
      currentMonth,
    })
)

export const selectCoreFxRates = createSelector(
  [selectCoreStoredFxRates, selectCoreCurrentFxRates],
  (storedRates, currentRates) =>
    buildFxRates({
      storedRates,
      currentRates,
    })
)

export const selectCoreFxRatesGetter = createSelector(
  [selectCoreFxRates, selectCoreCurrentFxRates],
  (rates, currentRates) =>
    buildFxRatesGetter({
      rates,
      currentRates,
    })
)

export const selectCoreConvertFx = createSelector(
  [selectCoreFxRatesGetter],
  buildFxConverter
)

export const selectCoreMonthList = createSelector(
  [selectCoreTransactionsHistory, selectCoreBudgets, selectCoreCurrentMonth],
  (transactions, budgets, currentMonth) =>
    buildMonthList({
      transactions,
      budgets,
      currentMonth,
    })
)

const selectCoreInBudgetAccountIds = createSelector(
  [selectCoreAccountSlice],
  account => getZerroInBudgetAccountIds({ account }),
  { memoizeOptions: { resultEqualityCheck: shallowEqual } }
)

export const selectCoreCurrentFunds = createSelector(
  [selectCoreAccountSlice, selectCoreInBudgetAccountIds, selectCoreInstCodeMap],
  (accounts, inBudgetIds, instrumentCodeById) =>
    buildCurrentFunds({
      accounts,
      inBudgetIds,
      instrumentCodeById,
    })
)

export const selectCoreRawActivity = createSelector(
  [
    selectCoreTransactionsHistory,
    selectCoreInBudgetAccountIds,
    selectCoreDebtAccountId,
    selectCoreDebtors,
    selectCoreInstruments,
  ],
  (transactions, inBudgetAccountIds, debtAccountId, debtors, instruments) =>
    buildRawActivity({
      transactions,
      inBudgetAccountIds,
      debtAccountId,
      debtors,
      instruments,
    })
)

export const selectCoreActivity = createSelector(
  [selectCoreRawActivity, selectCoreKeepingEnvelopeIds],
  (rawActivity, keepingEnvelopeIds) =>
    buildActivity({
      rawActivity,
      keepingEnvelopeIds,
    })
)

export const selectCoreEnvMetrics = createSelector(
  [
    selectCoreMonthList,
    selectCoreDomainEnvelopes,
    selectCoreActivity,
    selectCoreBudgets,
    selectCoreConvertFx,
  ],
  (monthList, envelopes, activity, budgets, convertFx) =>
    buildEnvMetrics({
      monthList,
      envelopes,
      activity,
      budgets,
      convertFx,
    })
)

export const selectCoreSortedActivity = createSelector(
  [selectCoreRawActivity, selectCoreKeepingEnvelopeIds, selectCoreConvertFx],
  (rawActivity, keepingEnvelopeIds, convertFx) =>
    buildSortedActivity({
      rawActivity,
      keepingEnvelopeIds,
      convertFx,
    })
)

export const selectCoreMonthTotals = createSelector(
  [
    selectCoreMonthList,
    selectCoreCurrentFunds,
    selectCoreActivity,
    selectCoreEnvMetrics,
    selectCoreConvertFx,
    selectCoreCurrentMonth,
  ],
  (monthList, currentFunds, activity, envMetrics, convertFx, currentMonth) =>
    buildMonthTotals({
      monthList,
      currentFunds,
      activity,
      envMetrics,
      convertFx,
      currentMonth,
    })
)

export const selectCoreGoals = createSelector(
  [
    selectCoreRawGoals,
    selectCoreMonthList,
    selectCoreEnvMetrics,
    selectCoreSortedActivity,
    selectCoreConvertFx,
  ],
  (rawGoals, monthList, envMetrics, sortedActivity, convertFx) =>
    buildGoals({
      rawGoals,
      monthList,
      envMetrics,
      sortedActivity,
      convertFx,
    })
)

export const selectCoreGoalTotals = createSelector(
  [selectCoreGoals, selectCoreConvertFx],
  buildGoalTotals
)

export const selectCoreHistoryStart = createSelector(
  [selectCoreTransactionsHistory, selectCoreCurrentDate],
  getHistoryStart
)

export const selectCoreBalances = createSelector(
  [
    selectCoreTransactionsHistory,
    selectCoreAccounts,
    selectCoreDebtors,
    selectCoreMerchants,
    selectCoreInstCodeMap,
    selectCoreDebtAccountId,
  ],
  (
    transactions,
    accounts,
    debtors,
    merchants,
    instrumentCodeById,
    debtAccountId
  ) =>
    buildBalances({
      transactions,
      accounts,
      debtors,
      merchants,
      instrumentCodeById,
      debtAccountId,
    })
)

export const selectCoreBalancesByDate = createSelector(
  [selectCoreBalances, selectCoreHistoryStart, selectCoreCurrentDate],
  (balances, historyStart, currentDate) =>
    buildBalancesByDate({
      balances,
      historyStart,
      currentDate,
    })
)

export const selectCoreDisplayCurrency = createSelector(
  [getSavedCurrency, userModel.getUserCurrency],
  (savedCurrency, userCurrency) => savedCurrency || userCurrency
)

export const selectCoreDisplayConverter = createSelector(
  [selectCoreConvertFx, selectCoreDisplayCurrency],
  (convert, currency) =>
    (
      amount: Parameters<typeof convert>[0],
      date: Parameters<typeof convert>[2]
    ) =>
      convert(amount, currency, date)
)

export const selectCoreDisplayBalancesByDate = createSelector(
  [selectCoreBalancesByDate, selectCoreDisplayConverter],
  convertBalancesToDisplay
)

let labelsCacheLanguage: string | undefined
let labelsCache: TEnvelopeLabels | undefined

function getCoreEnvelopeLabels(): TEnvelopeLabels {
  if (labelsCache && labelsCacheLanguage === i18n.language) return labelsCache

  labelsCacheLanguage = i18n.language
  labelsCache = {
    defaultTagGroup: i18n.t('defaultTagGroup', { ns: 'common' }),
    defaultAccountGroup: i18n.t('defaultAccountGroup', { ns: 'common' }),
    defaultMerchantGroup: i18n.t('defaultMerchantGroup', { ns: 'common' }),
    defaultPayeeGroup: i18n.t('defaultPayeeGroup', { ns: 'common' }),
  }
  return labelsCache
}
