import { describe, expect, it } from 'vitest'
import type { RootState } from 'store'
import { makeDemoStore } from '../../support/demo'
import { makeTestRootState } from 'store/testing'
import * as selectors from '../../support/testing/reduxSelectors'
import * as activity from './activity'

const NOW = Date.parse('2026-05-15T12:00:00Z')

/**
 * Guards the memoization contract the whole read model rests on: a projection
 * must depend on the slices it reads, never on the store as a whole. Without
 * this, an unrelated write silently recomputes `buildRawActivity` (~18ms on a
 * large account) and everything downstream of it.
 *
 * `reminderMarker` is the probe because no projection reads it, so every node
 * below must survive a change to it with its reference intact.
 */
const nodes: Record<string, (state: RootState) => unknown> = {
  transactionsHistory: selectors.selectTransactionsHistory,
  transactionIds: selectors.selectTransactionIds,
  historyStart: selectors.selectHistoryStart,
  instCodeMap: selectors.selectInstCodeMap,
  debtors: selectors.selectDebtors,
  domainEnvelopes: selectors.selectDomainEnvelopes,
  envelopes: selectors.selectEnvelopes,
  keepingEnvelopeIds: selectors.selectKeepingEnvelopeIds,
  budgets: selectors.selectBudgets,
  monthList: selectors.selectMonthList,
  currentFunds: selectors.selectCurrentFunds,
  routingContext: activity.selectTransactionRoutingContext,
  rawActivity: selectors.selectRawActivity,
  activity: selectors.selectActivity,
  envMetrics: selectors.selectEnvMetrics,
  sortedActivity: selectors.selectSortedActivity,
  monthTotals: selectors.selectMonthTotals,
  goals: selectors.selectGoals,
  goalTotals: selectors.selectGoalTotals,
  balances: selectors.selectBalances,
  balancesByDate: selectors.selectBalancesByDate,
  fxRates: selectors.selectFxRates,
  userSettings: selectors.selectUserSettings,
}

describe('projection memoization', () => {
  it('keeps every projection stable across an unrelated slice change', () => {
    const store = makeDemoStore({ now: NOW })
    const state = makeTestRootState(store)
    const before = Object.fromEntries(
      Object.entries(nodes).map(([name, select]) => [name, select(state)])
    )

    // New `current` object and a new unread slice; every read slice keeps its
    // reference, so nothing below may recompute.
    const unrelated = makeTestRootState({
      ...store,
      reminderMarker: { ...store.reminderMarker },
    })

    const recomputed = Object.keys(nodes).filter(
      name => nodes[name](unrelated) !== before[name]
    )
    expect(recomputed).toEqual([])
  })

  it('spares the activity chain when an account changes but its ids do not', () => {
    // The expensive guard: `inBudgetAccountIds` is rebuilt from the whole
    // account map, so without result equality any account edit would recompute
    // `buildRawActivity` (~18ms on a large account) and everything under it.
    const store = makeDemoStore({ now: NOW })
    const state = makeTestRootState(store)
    const beforeIds = selectors.selectRawActivity(state)
    const beforeRouting = activity.selectTransactionRoutingContext(state)

    const [accountId] = Object.keys(store.account)
    const renamed = makeTestRootState({
      ...store,
      account: {
        ...store.account,
        [accountId]: { ...store.account[accountId], syncID: ['changed'] },
      },
    })

    expect(activity.selectTransactionRoutingContext(renamed)).toBe(
      beforeRouting
    )
    expect(selectors.selectRawActivity(renamed)).toBe(beforeIds)
  })

  it('still recomputes when a slice a projection reads does change', () => {
    const store = makeDemoStore({ now: NOW })
    const state = makeTestRootState(store)
    const beforeActivity = selectors.selectRawActivity(state)
    const beforeBudgets = selectors.selectBudgets(state)

    const [transactionId] = Object.keys(store.transaction)
    const changed = makeTestRootState({
      ...store,
      transaction: {
        ...store.transaction,
        [transactionId]: {
          ...store.transaction[transactionId],
          outcome: store.transaction[transactionId].outcome + 1,
        },
      },
    })

    expect(selectors.selectRawActivity(changed)).not.toBe(beforeActivity)
    // …and an unrelated projection is still spared.
    expect(selectors.selectBudgets(changed)).toBe(beforeBudgets)
  })
})
