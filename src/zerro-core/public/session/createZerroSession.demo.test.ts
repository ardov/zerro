import { describe, expect, it, vi } from 'vitest'

import { createZerroSession } from './createZerroSession'
import {
  coreNextDemoContext,
  coreNextDemoOptions,
  makeCoreNextDemoRootState,
  makeCoreNextDemoStore,
} from '../../support/testing/demoState'
import {
  selectActivity,
  selectBalances,
  selectBalancesByDate,
  selectBudgets,
  selectCurrentFunds,
  selectCurrentFxRates,
  selectDebtors,
  selectDomainEnvelopes,
  selectDomainEnvelopeStructure,
  selectEnvMetrics,
  selectFxRates,
  selectGoals,
  selectGoalTotals,
  selectHistoryStart,
  selectKeepingEnvelopeIds,
  selectMonthList,
  selectMonthTotals,
  selectRawActivity,
  selectRawGoals,
  selectSortedActivity,
  selectTransactionsHistory,
  selectUserSettings,
} from '../../support/testing/reduxSelectors'
import { hashJson } from '../../support/testing/stableJson'

describe('createZerroSession on deterministic demo data', () => {
  it('matches the current core Redux adapter selectors', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(coreNextDemoOptions.now))

    try {
      const data = makeCoreNextDemoStore()
      const state = makeCoreNextDemoRootState(data)
      const session = createZerroSession(data, coreNextDemoContext)

      expectSameJsonHash(
        'userSettings',
        session.settings.get(),
        selectUserSettings(state)
      )
      expectSameJsonHash(
        'debtors',
        session.debtors.getAll(),
        selectDebtors(state)
      )
      expectSameJsonHash(
        'transactionsHistory',
        session.transactions.getHistory(),
        selectTransactionsHistory(state)
      )
      expectSameJsonHash(
        'envelopes',
        session.envelopes.getAll(),
        selectDomainEnvelopes(state)
      )
      expectSameJsonHash(
        'envelopeStructure',
        session.envelopes.getStructure(),
        selectDomainEnvelopeStructure(state)
      )
      expectSameJsonHash(
        'keepingEnvelopeIds',
        session.envelopes.getKeepingIds(),
        selectKeepingEnvelopeIds(state)
      )
      expectSameJsonHash(
        'budgets',
        session.budgets.getAll(),
        selectBudgets(state)
      )
      expectSameJsonHash(
        'currentFunds',
        session.accounts.getCurrentFunds(),
        selectCurrentFunds(state)
      )
      expectSameJsonHash(
        'currentFxRates',
        session.fx.getCurrentRates(),
        selectCurrentFxRates(state)
      )
      expectSameJsonHash('fxRates', session.fx.getRates(), selectFxRates(state))
      expectSameJsonHash(
        'rawActivity',
        session.activity.getRaw(),
        selectRawActivity(state)
      )
      expectSameJsonHash(
        'activity',
        session.activity.getAll(),
        selectActivity(state)
      )
      expectSameJsonHash(
        'monthList',
        session.months.getList(),
        selectMonthList(state)
      )
      expectSameJsonHash(
        'envMetrics',
        session.envelopes.getMetrics(),
        selectEnvMetrics(state)
      )
      expectSameJsonHash(
        'sortedActivity',
        session.activity.getSorted(),
        selectSortedActivity(state)
      )
      expectSameJsonHash(
        'monthTotals',
        session.months.getTotals(),
        selectMonthTotals(state)
      )
      expectSameJsonHash(
        'rawGoals',
        session.goals.getRaw(),
        selectRawGoals(state)
      )
      expectSameJsonHash('goals', session.goals.getAll(), selectGoals(state))
      expectSameJsonHash(
        'goalTotals',
        session.goals.getTotals(),
        selectGoalTotals(state)
      )
      expectSameJsonHash(
        'historyStart',
        session.transactions.getHistoryStart(),
        selectHistoryStart(state)
      )
      expectSameJsonHash(
        'balances',
        session.balances.getAll(),
        selectBalances(state)
      )
      expectSameJsonHash(
        'balancesByDate',
        session.balances.getByDate(),
        selectBalancesByDate(state)
      )
    } finally {
      vi.useRealTimers()
    }
  })
})

function expectSameJsonHash(name: string, actual: unknown, expected: unknown) {
  expect(hashJson(actual), name).toBe(hashJson(expected))
}
