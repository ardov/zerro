import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from 'store'
import {
  buildActivity,
  buildActivityRoutingContext,
  buildCurrentFunds,
  buildEnvMetrics,
  buildRawActivity,
  buildSortedActivity,
} from '../domain/zerro'
import { graph } from './graph'
import * as accounts from './accounts'
import * as budgets from './budgets'
import * as debtors from './debtors'
import * as envelopes from './envelopes'
import * as fxRates from './fxRates'
import * as instruments from './instruments'
import * as monthList from './monthList'
import * as transactions from './transactions'

const selectInBudgetAccountIds = (state: RootState) =>
  graph.inBudgetAccountIds(state.data.current)
export const selectCurrentFunds = createSelector(
  [accounts.selectAll, selectInBudgetAccountIds, instruments.selectCodeMap],
  (account, inBudgetIds, instrumentCodeById) =>
    buildCurrentFunds({ accounts: account, inBudgetIds, instrumentCodeById })
)
export const selectTransactionRoutingContext = createSelector(
  [selectInBudgetAccountIds, accounts.selectDebtAccountId, debtors.selectAll],
  (inBudgetAccountIds, debtAccountId, debtors) =>
    buildActivityRoutingContext({ inBudgetAccountIds, debtAccountId, debtors })
)
export const selectRaw = createSelector(
  [
    transactions.selectHistory,
    selectTransactionRoutingContext,
    instruments.selectAll,
  ],
  (transactions, routing, instruments) =>
    buildRawActivity({ transactions, routing, instruments })
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
