import { createSelector } from '@reduxjs/toolkit'
import { toISOMonth } from '6-shared/helpers/date'
import { i18n } from '6-shared/localization'
import { accountModel } from '5-entities/account'
import { getTagBudgets } from '5-entities/budget'
import { fxRateModel } from '5-entities/currency/fxRate'
import { instrumentModel } from '5-entities/currency/instrument'
import { debtorModel } from '5-entities/debtors'
import { getCurrentFunds } from '5-entities/envBalances/1 - currentFunds'
import { getMonthList } from '5-entities/envBalances/1 - monthList'
import { tagModel } from '5-entities/tag'
import { trModel } from '5-entities/transaction'
import { userModel } from '5-entities/user'
import type { RootState } from 'store'
import {
  buildActivity,
  buildBudgets,
  buildEnvelopes,
  buildEnvMetrics,
  buildMonthTotals,
  buildRawActivity,
  getEnvBudgets,
  getEnvelopeMeta,
  getKeepingEnvelopes,
  getUserSettings,
  TEnvelopeLabels,
} from '../../zerro'

export const selectCoreCurrentData = (state: RootState) => state.data.current

export const selectCoreUserSettings = createSelector(
  [selectCoreCurrentData],
  getUserSettings
)

export const selectCoreEnvelopeMeta = createSelector(
  [selectCoreCurrentData],
  getEnvelopeMeta
)

export const selectCoreEnvBudgets = createSelector(
  [selectCoreCurrentData],
  getEnvBudgets
)

export const selectCoreEnvelopeLabels = () => getCoreEnvelopeLabels()

const selectCoreCompiledEnvelopes = createSelector(
  [
    debtorModel.getDebtors,
    tagModel.getPopulatedTags,
    accountModel.getSavingAccounts,
    selectCoreEnvelopeMeta,
    userModel.getUserCurrency,
    selectCoreEnvelopeLabels,
  ],
  (
    debtors,
    populatedTags,
    savingAccounts,
    envelopeMeta,
    userCurrency,
    labels
  ) =>
    buildEnvelopes({
      debtors,
      populatedTags,
      savingAccounts,
      envelopeMeta,
      userCurrency,
      labels,
    })
)

export const selectCoreEnvelopes = (state: RootState) =>
  selectCoreCompiledEnvelopes(state).byId

export const selectCoreEnvelopeStructure = (state: RootState) =>
  selectCoreCompiledEnvelopes(state).structure

export const selectCoreKeepingEnvelopeIds = createSelector(
  [selectCoreEnvelopes],
  getKeepingEnvelopes
)

export const selectCoreBudgets = createSelector(
  [getTagBudgets, selectCoreEnvBudgets, selectCoreUserSettings],
  (tagBudgets, envBudgets, userSettings) =>
    buildBudgets({
      tagBudgets,
      envBudgets,
      preferZmBudgets: userSettings.preferZmBudgets,
    })
)

export const selectCoreRawActivity = createSelector(
  [
    trModel.getTransactionsHistory,
    accountModel.getInBudgetAccounts,
    accountModel.getDebtAccountId,
    debtorModel.getDebtors,
    instrumentModel.getInstruments,
  ],
  (transactions, inBudgetAccounts, debtAccountId, debtors, instruments) =>
    buildRawActivity({
      transactions,
      inBudgetAccountIds: inBudgetAccounts.map(account => account.id),
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
    getMonthList,
    selectCoreEnvelopes,
    selectCoreActivity,
    selectCoreBudgets,
    fxRateModel.converter,
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

export const selectCoreCurrentMonth = () => toISOMonth(Date.now())

export const selectCoreMonthTotals = createSelector(
  [
    getMonthList,
    getCurrentFunds,
    selectCoreActivity,
    selectCoreEnvMetrics,
    fxRateModel.converter,
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
