import { createSelector } from '@reduxjs/toolkit'
import { shallowEqual } from 'react-redux'
import { toISODate, toISOMonth } from '6-shared/helpers/date'
import { i18n } from '6-shared/localization'
import { accountModel } from '5-entities/account'
import { displayCurrency } from '5-entities/currency/displayCurrency'
import { instrumentModel } from '5-entities/currency/instrument'
import { merchantModel } from '5-entities/merchant'
import { tagModel } from '5-entities/tag'
import { trModel } from '5-entities/transaction'
import { userModel } from '5-entities/user'
import type { RootState } from 'store'
import {
  buildBalances,
  buildBalancesByDate,
  buildDebtors,
  convertBalancesToDisplay,
  getHistoryStart,
  getTagBudgets,
} from '../../zenmoney'
import {
  buildActivity,
  buildBudgets,
  buildCurrentFxRates,
  buildCurrentFunds,
  buildEnvelopes,
  buildStructure,
  buildEnvMetrics,
  flattenStructure,
  buildFxConverter,
  buildFxRates,
  buildFxRatesGetter,
  buildMonthList,
  buildMonthTotals,
  defaultEnvelopeGroupIds,
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
  TEnvelope,
  TGroupNode,
} from '../../zerro'

type TEnvelopeLabels = {
  defaultTagGroup: string
  defaultAccountGroup: string
  defaultMerchantGroup: string
  defaultPayeeGroup: string
}

export const selectCoreCurrentData = (state: RootState) => state.data.current

// Hidden data lives only in reminder comments; depending on the reminder slice
// keeps these selectors cached across unrelated data changes.
const selectCoreReminderSlice = (state: RootState) =>
  state.data.current.reminder

const selectCoreTagBudgetSlice = (state: RootState) => state.data.current.budget

const selectCoreAccountSlice = (state: RootState) => state.data.current.account

export const selectCoreUserSettings = createSelector(
  [selectCoreReminderSlice],
  reminder => getUserSettings({ reminder })
)

export const selectCoreEnvelopeMeta = createSelector(
  [selectCoreReminderSlice],
  reminder => getEnvelopeMeta({ reminder })
)

export const selectCoreEnvBudgets = createSelector(
  [selectCoreReminderSlice],
  reminder => getEnvBudgets({ reminder })
)

export const selectCoreRawGoals = createSelector(
  [selectCoreReminderSlice],
  reminder => getRawGoals({ reminder })
)

export const selectCoreStoredFxRates = createSelector(
  [selectCoreReminderSlice],
  reminder => getStoredFxRates({ reminder })
)

export const selectCoreEnvelopeLabels = () => getCoreEnvelopeLabels()

export const selectCoreDebtors = createSelector(
  [
    trModel.getTransactionsHistory,
    merchantModel.getMerchants,
    instrumentModel.getInstruments,
    accountModel.getDebtAccountId,
  ],
  (transactions, merchants, instruments, debtAccountId) =>
    buildDebtors({
      transactions,
      merchants,
      instruments,
      debtAccountId,
    })
)

const selectCoreCompiledEnvelopes = createSelector(
  [
    selectCoreDebtors,
    tagModel.getPopulatedTags,
    selectCoreAccountSlice,
    selectCoreEnvelopeMeta,
    userModel.getUserCurrency,
  ],
  (debtors, populatedTags, account, envelopeMeta, userCurrency) =>
    buildEnvelopes({
      debtors,
      populatedTags,
      savingAccounts: getZerroSavingAccounts({ account }),
      envelopeMeta,
      userCurrency,
    })
)

export const selectCoreStableEnvelopes = (state: RootState) =>
  selectCoreCompiledEnvelopes(state).byId

export const selectCoreStableEnvelopeStructure = (state: RootState) =>
  selectCoreCompiledEnvelopes(state).structure

const selectCoreLocalizedCompiledEnvelopes = createSelector(
  [selectCoreCompiledEnvelopes, selectCoreEnvelopeLabels],
  localizeDefaultEnvelopeGroups
)

export const selectCoreEnvelopes = (state: RootState) =>
  selectCoreLocalizedCompiledEnvelopes(state).byId

export const selectCoreEnvelopeStructure = (state: RootState) =>
  selectCoreLocalizedCompiledEnvelopes(state).structure

export const selectCoreKeepingEnvelopeIds = createSelector(
  [selectCoreStableEnvelopes],
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

export const selectCoreCurrentMonth = () => toISOMonth(Date.now())

export const selectCoreCurrentDate = () => toISODate(Date.now())

export const selectCoreCurrentFxRates = createSelector(
  [instrumentModel.getInstruments, selectCoreCurrentMonth],
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
  [trModel.getTransactionsHistory, selectCoreBudgets, selectCoreCurrentMonth],
  (transactions, budgets, currentMonth) =>
    buildMonthList({
      transactions,
      budgets,
      currentMonth,
    })
)

export const selectCoreInBudgetAccountIds = createSelector(
  [selectCoreAccountSlice],
  account => getZerroInBudgetAccountIds({ account }),
  { memoizeOptions: { resultEqualityCheck: shallowEqual } }
)

export const selectCoreCurrentFunds = createSelector(
  [
    selectCoreAccountSlice,
    selectCoreInBudgetAccountIds,
    instrumentModel.getInstCodeMap,
  ],
  (accounts, inBudgetIds, instrumentCodeById) =>
    buildCurrentFunds({
      accounts,
      inBudgetIds,
      instrumentCodeById,
    })
)

export const selectCoreRawActivity = createSelector(
  [
    trModel.getTransactionsHistory,
    selectCoreInBudgetAccountIds,
    accountModel.getDebtAccountId,
    selectCoreDebtors,
    instrumentModel.getInstruments,
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
    selectCoreStableEnvelopes,
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
  [trModel.getTransactionsHistory, selectCoreCurrentDate],
  getHistoryStart
)

export const selectCoreBalances = createSelector(
  [
    trModel.getTransactionsHistory,
    accountModel.getAccounts,
    selectCoreDebtors,
    merchantModel.getMerchants,
    instrumentModel.getInstCodeMap,
    accountModel.getDebtAccountId,
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

export const selectCoreDisplayBalancesByDate = createSelector(
  [selectCoreBalancesByDate, displayCurrency.getConverter],
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

function localizeDefaultEnvelopeGroups(
  compiled: { byId: Record<string, TEnvelope>; structure: TGroupNode[] },
  labels: TEnvelopeLabels
) {
  const byId = Object.fromEntries(
    Object.entries(compiled.byId).map(([id, envelope]) => [
      id,
      {
        ...envelope,
        group: localizeGroup(envelope.group, labels),
      },
    ])
  )
  const structure = buildStructure(byId)

  flattenStructure(structure).forEach((node, index) => {
    if (node.type === 'group') return
    const envelope = byId[node.id]
    envelope.parent = node.parent
    envelope.group = node.group
    envelope.children = node.children.map(child => child.id)
    envelope.index = index
  })

  return {
    byId,
    structure,
  }
}

function localizeGroup(group: string, labels: TEnvelopeLabels): string {
  switch (group) {
    case defaultEnvelopeGroupIds.tags:
      return labels.defaultTagGroup
    case defaultEnvelopeGroupIds.accounts:
      return labels.defaultAccountGroup
    case defaultEnvelopeGroupIds.merchants:
      return labels.defaultMerchantGroup
    case defaultEnvelopeGroupIds.payees:
      return labels.defaultPayeeGroup
    default:
      return group
  }
}
