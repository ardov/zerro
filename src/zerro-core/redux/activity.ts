import { createSelector } from '@reduxjs/toolkit'
import { shallowEqual } from 'react-redux'
import {
  buildActivity,
  buildCurrentFunds,
  buildEnvMetrics,
  buildRawActivity,
  buildSortedActivity,
  getZerroInBudgetAccountIds,
} from '../domain/zerro'
import * as accounts from './accounts'
import * as budgets from './budgets'
import * as debtors from './debtors'
import * as envelopes from './envelopes'
import * as fxRates from './fxRates'
import * as instruments from './instruments'
import * as monthList from './monthList'
import { selectAccountSlice } from './state'
import * as transactions from './transactions'

const selectInBudgetAccountIds = createSelector(
  [selectAccountSlice],
  account => getZerroInBudgetAccountIds({ account }),
  { memoizeOptions: { resultEqualityCheck: shallowEqual } }
)
export const selectCurrentFunds = createSelector(
  [selectAccountSlice, selectInBudgetAccountIds, instruments.selectCodeMap],
  (account, inBudgetIds, instrumentCodeById) =>
    buildCurrentFunds({ accounts: account, inBudgetIds, instrumentCodeById })
)
export const selectRaw = createSelector(
  [
    transactions.selectHistory,
    selectInBudgetAccountIds,
    accounts.selectDebtAccountId,
    debtors.selectAll,
    instruments.selectAll,
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
export const selectTransactionRoutingContext = createSelector(
  [selectInBudgetAccountIds, accounts.selectDebtAccountId, debtors.selectAll],
  (inBudgetAccountIds, debtAccountId, debtors) => ({
    inBudgetAccountIds: new Set(inBudgetAccountIds),
    debtAccountId,
    debtors,
  })
)
export const selectAll = createSelector(
  [selectRaw, envelopes.selectKeepingIds],
  (rawActivity, keepingEnvelopeIds) =>
    buildActivity({ rawActivity, keepingEnvelopeIds })
)
export const selectEnvelopeMetrics = createSelector(
  [
    monthList.selectList,
    envelopes.selectDomain,
    selectAll,
    budgets.selectAll,
    fxRates.selectConvertFx,
  ],
  (monthList, envelopesById, activity, budgetsById, convertFx) =>
    buildEnvMetrics({
      monthList,
      envelopes: envelopesById,
      activity,
      budgets: budgetsById,
      convertFx,
    })
)
export const selectSorted = createSelector(
  [selectRaw, envelopes.selectKeepingIds, fxRates.selectConvertFx],
  (rawActivity, keepingEnvelopeIds, convertFx) =>
    buildSortedActivity({ rawActivity, keepingEnvelopeIds, convertFx })
)
export type { TActivitySummary, TSortedActivityNode } from '../domain/zerro'
export { EnvActivity } from '../domain/zerro'
