import { describe, expect, it, vi } from 'vitest'

import { createZerroSession } from './createZerroSession'
import {
  coreNextDemoContext,
  coreNextDemoOptions,
  makeCoreNextDemoRootState,
  makeCoreNextDemoStore,
} from '../testing/demoState'
import { hashJson } from '../testing/stableJson'

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
      const [
        { tagModel },
        {
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
          selectCoreStableEnvelopes,
          selectCoreStableEnvelopeStructure,
          selectCoreUserSettings,
        },
      ] = await Promise.all([
        import('5-entities/tag'),
        import('../adapters/redux/selectors'),
      ])

      const session = createZerroSession(data, coreNextDemoContext, {
        populatedTags: tagModel.getPopulatedTags(state),
      })

      expectSameJsonHash(
        'userSettings',
        session.read.userSettings(),
        selectCoreUserSettings(state)
      )
      expectSameJsonHash(
        'debtors',
        session.read.debtors(),
        selectCoreDebtors(state)
      )
      expectSameJsonHash(
        'envelopes',
        session.read.envelopes(),
        selectCoreStableEnvelopes(state)
      )
      expectSameJsonHash(
        'envelopeStructure',
        session.read.envelopeStructure(),
        selectCoreStableEnvelopeStructure(state)
      )
      expectSameJsonHash(
        'keepingEnvelopeIds',
        session.read.keepingEnvelopeIds(),
        selectCoreKeepingEnvelopeIds(state)
      )
      expectSameJsonHash(
        'budgets',
        session.read.budgets(),
        selectCoreBudgets(state)
      )
      expectSameJsonHash(
        'currentFunds',
        session.read.currentFunds(),
        selectCoreCurrentFunds(state)
      )
      expectSameJsonHash(
        'currentFxRates',
        session.read.currentFxRates(),
        selectCoreCurrentFxRates(state)
      )
      expectSameJsonHash(
        'fxRates',
        session.read.fxRates(),
        selectCoreFxRates(state)
      )
      expectSameJsonHash(
        'rawActivity',
        session.read.rawActivity(),
        selectCoreRawActivity(state)
      )
      expectSameJsonHash(
        'activity',
        session.read.activity(),
        selectCoreActivity(state)
      )
      expectSameJsonHash(
        'monthList',
        session.read.monthList(),
        selectCoreMonthList(state)
      )
      expectSameJsonHash(
        'envMetrics',
        session.read.envMetrics(),
        selectCoreEnvMetrics(state)
      )
      expectSameJsonHash(
        'sortedActivity',
        session.read.sortedActivity(),
        selectCoreSortedActivity(state)
      )
      expectSameJsonHash(
        'monthTotals',
        session.read.monthTotals(),
        selectCoreMonthTotals(state)
      )
      expectSameJsonHash(
        'rawGoals',
        session.read.rawGoals(),
        selectCoreRawGoals(state)
      )
      expectSameJsonHash('goals', session.read.goals(), selectCoreGoals(state))
      expectSameJsonHash(
        'goalTotals',
        session.read.goalTotals(),
        selectCoreGoalTotals(state)
      )
      expectSameJsonHash(
        'historyStart',
        session.read.historyStart(),
        selectCoreHistoryStart(state)
      )
      expectSameJsonHash(
        'balances',
        session.read.balances(),
        selectCoreBalances(state)
      )
      expectSameJsonHash(
        'balancesByDate',
        session.read.balancesByDate(),
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
