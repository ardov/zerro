import type { TCoreContext } from '../../types'
import type { TDataStore } from '../../domain/zenmoney/store'
import { createProjectionGraph } from '../graph'
import { buildBalances, buildBalancesByDate } from '../../domain/zenmoney'
import {
  buildActivity,
  buildActivityRoutingContext,
  buildCurrentFunds,
  buildEnvMetrics,
  buildGoals,
  buildGoalTotals,
  buildMonthTotals,
  buildRawActivity,
  buildSortedActivity,
} from '../../domain/zerro'

export type TZerroSession = ReturnType<typeof createZerroSession>

export function createZerroSession(data: TDataStore, ctx: TCoreContext) {
  // One snapshot means one instant. The graph reads `now()` per call so the
  // long-lived Redux instance follows the clock; a session must not, so freeze
  // it here and every derived date stays stable for the session lifetime.
  const frozenNow = ctx.now()
  const g = createProjectionGraph({ ...ctx, now: () => frozenNow })
  const bind =
    <T>(node: (snapshot: TDataStore) => T) =>
    () =>
      node(data)

  const currentDate = g.currentDate
  const currentMonth = g.currentMonth
  const userSettings = bind(g.userSettings)
  const rawGoals = bind(g.rawGoals)
  const debtAccountId = bind(g.debtAccountId)
  const instrumentCodeById = bind(g.instrumentCodeById)
  const transactionsHistory = bind(g.transactionsHistory)
  const currentFxRates = bind(g.currentFxRates)
  const fxRates = bind(g.fxRates)
  const convertFx = bind(g.convertFx)
  const debtors = bind(g.debtors)
  const envelopes = bind(g.envelopes)
  const envelopeStructure = bind(g.envelopeStructure)
  const keepingEnvelopeIds = bind(g.keepingEnvelopeIds)
  const budgets = bind(g.budgets)
  const monthList = bind(g.monthList)
  const inBudgetAccountIds = bind(g.inBudgetAccountIds)
  const currentFunds = memo(() =>
    buildCurrentFunds({
      accounts: data.account,
      inBudgetIds: inBudgetAccountIds(),
      instrumentCodeById: instrumentCodeById(),
    })
  )
  const routingContext = memo(() =>
    buildActivityRoutingContext({
      inBudgetAccountIds: inBudgetAccountIds(),
      debtAccountId: debtAccountId(),
      debtors: debtors(),
    })
  )
  const rawActivity = memo(() =>
    buildRawActivity({
      transactions: transactionsHistory(),
      routing: routingContext(),
      instruments: data.instrument,
    })
  )
  const activity = memo(() =>
    buildActivity({
      rawActivity: rawActivity(),
      keepingEnvelopeIds: keepingEnvelopeIds(),
    })
  )
  const envMetrics = memo(() =>
    buildEnvMetrics({
      monthList: monthList(),
      envelopes: envelopes(),
      activity: activity(),
      budgets: budgets(),
      convertFx: convertFx(),
    })
  )
  const sortedActivity = memo(() =>
    buildSortedActivity({
      rawActivity: rawActivity(),
      keepingEnvelopeIds: keepingEnvelopeIds(),
      convertFx: convertFx(),
    })
  )
  const monthTotals = memo(() =>
    buildMonthTotals({
      monthList: monthList(),
      currentFunds: currentFunds(),
      activity: activity(),
      envMetrics: envMetrics(),
      convertFx: convertFx(),
      currentMonth: currentMonth(),
    })
  )
  const goals = memo(() =>
    buildGoals({
      rawGoals: rawGoals(),
      monthList: monthList(),
      envMetrics: envMetrics(),
      sortedActivity: sortedActivity(),
      convertFx: convertFx(),
    })
  )
  const goalTotals = memo(() => buildGoalTotals(goals(), convertFx()))
  const historyStart = bind(g.historyStart)
  const balances = memo(() =>
    buildBalances({
      transactions: transactionsHistory(),
      accounts: data.account,
      debtors: debtors(),
      merchants: data.merchant,
      instrumentCodeById: instrumentCodeById(),
      debtAccountId: debtAccountId(),
    })
  )
  const balancesByDate = memo(() =>
    buildBalancesByDate({
      balances: balances(),
      historyStart: historyStart(),
      currentDate: currentDate(),
    })
  )
  const calendar = {
    getCurrentDate: currentDate,
    getCurrentMonth: currentMonth,
  }
  const settings = {
    get: userSettings,
  }
  const transactions = {
    getHistory: transactionsHistory,
    getHistoryStart: historyStart,
  }
  const debtorsApi = {
    getAll: debtors,
  }
  const accounts = {
    getCurrentFunds: currentFunds,
  }
  const envelopesApi = {
    getAll: envelopes,
    getStructure: envelopeStructure,
    getKeepingIds: keepingEnvelopeIds,
    getMetrics: envMetrics,
  }
  const budgetsApi = {
    getAll: budgets,
  }
  const activityApi = {
    getRoutingContext: routingContext,
    getRaw: rawActivity,
    getAll: activity,
    getSorted: sortedActivity,
  }
  const months = {
    getList: monthList,
    getTotals: monthTotals,
  }
  const goalsApi = {
    getRaw: rawGoals,
    getAll: goals,
    getTotals: goalTotals,
  }
  const balancesApi = {
    getAll: balances,
    getByDate: balancesByDate,
  }
  const fx = {
    getCurrentRates: currentFxRates,
    getRates: fxRates,
  }

  return {
    data,
    ctx,
    calendar,
    settings,
    transactions,
    debtors: debtorsApi,
    accounts,
    envelopes: envelopesApi,
    budgets: budgetsApi,
    activity: activityApi,
    months,
    goals: goalsApi,
    balances: balancesApi,
    fx,
  }
}

function memo<T>(calculate: () => T): () => T {
  let hasValue = false
  let value: T
  return () => {
    if (!hasValue) {
      value = calculate()
      hasValue = true
    }
    return value
  }
}
