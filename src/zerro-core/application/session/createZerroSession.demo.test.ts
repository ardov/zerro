import { describe, expect, it, vi } from 'vitest'

import { createZerroSession } from './createZerroSession'
import {
  coreNextDemoContext,
  coreNextDemoOptions,
  makeCoreNextDemoRootState,
  makeCoreNextDemoStore,
} from '../../testing/demoState'
import { hashJson } from '../../testing/stableJson'

vi.mock('5-entities/shared/hidden-store/dataAccount', () => ({
  DATA_ACC_NAME: '🤖 [Zerro Data]',
  getDataAccountId: () => undefined,
  prepareDataAccount: () => {
    throw new Error('prepareDataAccount is not available in demo tests')
  },
}))

describe('createZerroSession on deterministic demo data', () => {
  it('matches the current core Redux adapter selectors', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(coreNextDemoOptions.now))

    try {
      const data = makeCoreNextDemoStore()
      const state = makeCoreNextDemoRootState(data)
      const {
        selectCoreActivity,
        selectCoreBalances,
        selectCoreBalancesByDate,
        selectCoreBudgets,
        selectCoreCurrentFunds,
        selectCoreCurrentFxRates,
        selectCoreDebtors,
        selectCoreEnvMetrics,
        selectCoreFxRates,
        selectCoreGoalTotals,
        selectCoreGoals,
        selectCoreHistoryStart,
        selectCoreKeepingEnvelopeIds,
        selectCoreMonthList,
        selectCoreMonthTotals,
        selectCoreRawActivity,
        selectCoreRawGoals,
        selectCoreSortedActivity,
        selectCoreDomainEnvelopes,
        selectCoreDomainEnvelopeStructure,
        selectCoreTransactionsHistory,
        selectCoreUserSettings,
      } = await import('../../redux/selectors')

      const session = createZerroSession(data, coreNextDemoContext)

      expectSameJsonHash(
        'userSettings',
        session.settings.get(),
        selectCoreUserSettings(state)
      )
      expectSameJsonHash(
        'debtors',
        session.debtors.getAll(),
        selectCoreDebtors(state)
      )
      expectSameJsonHash(
        'transactionsHistory',
        session.transactions.getHistory(),
        selectCoreTransactionsHistory(state)
      )
      expectSameJsonHash(
        'envelopes',
        session.envelopes.getAll(),
        selectCoreDomainEnvelopes(state)
      )
      expectSameJsonHash(
        'envelopeStructure',
        session.envelopes.getStructure(),
        selectCoreDomainEnvelopeStructure(state)
      )
      expectSameJsonHash(
        'keepingEnvelopeIds',
        session.envelopes.getKeepingIds(),
        selectCoreKeepingEnvelopeIds(state)
      )
      expectSameJsonHash(
        'budgets',
        session.budgets.getAll(),
        selectCoreBudgets(state)
      )
      expectSameJsonHash(
        'currentFunds',
        session.accounts.getCurrentFunds(),
        selectCoreCurrentFunds(state)
      )
      expectSameJsonHash(
        'currentFxRates',
        session.fx.getCurrentRates(),
        selectCoreCurrentFxRates(state)
      )
      expectSameJsonHash(
        'fxRates',
        session.fx.getRates(),
        selectCoreFxRates(state)
      )
      expectSameJsonHash(
        'rawActivity',
        session.read.rawActivity(),
        selectCoreRawActivity(state)
      )
      expectSameJsonHash(
        'activity',
        session.activity.getAll(),
        selectCoreActivity(state)
      )
      expectSameJsonHash(
        'monthList',
        session.months.getList(),
        selectCoreMonthList(state)
      )
      expectSameJsonHash(
        'envMetrics',
        session.envelopes.getMetrics(),
        selectCoreEnvMetrics(state)
      )
      expectSameJsonHash(
        'sortedActivity',
        session.activity.getSorted(),
        selectCoreSortedActivity(state)
      )
      expectSameJsonHash(
        'monthTotals',
        session.months.getTotals(),
        selectCoreMonthTotals(state)
      )
      expectSameJsonHash(
        'rawGoals',
        session.read.rawGoals(),
        selectCoreRawGoals(state)
      )
      expectSameJsonHash(
        'goals',
        session.goals.getAll(),
        selectCoreGoals(state)
      )
      expectSameJsonHash(
        'goalTotals',
        session.goals.getTotals(),
        selectCoreGoalTotals(state)
      )
      expectSameJsonHash(
        'historyStart',
        session.transactions.getHistoryStart(),
        selectCoreHistoryStart(state)
      )
      expectSameJsonHash(
        'balances',
        session.balances.getAll(),
        selectCoreBalances(state)
      )
      expectSameJsonHash(
        'balancesByDate',
        session.balances.getByDate(),
        selectCoreBalancesByDate(state)
      )
    } finally {
      vi.useRealTimers()
    }
  })
})

function expectSameJsonHash(name: string, actual: unknown, expected: unknown) {
  expect(hashJson(actual), name).toBe(hashJson(expected))
}
