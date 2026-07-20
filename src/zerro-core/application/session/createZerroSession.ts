import type { TCoreContext } from '../../types'
import type { TDataStore } from '../../domain/zenmoney/store'
import { createProjectionGraph } from '../graph'
import {
  buildBalances,
  buildBalancesByDate,
  buildDebtors,
} from '../../domain/zenmoney'
import {
  buildActivity,
  buildActivityRoutingContext,
  buildBudgets,
  buildCurrentFxRates,
  buildCurrentFunds,
  buildEnvelopes,
  buildEnvMetrics,
  buildFxConverter,
  buildFxRates,
  buildFxRatesGetter,
  buildGoals,
  buildGoalTotals,
  buildMonthList,
  buildMonthTotals,
  buildRawActivity,
  buildSortedActivity,
  getKeepingEnvelopes,
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
  const envelopeMeta = bind(g.envelopeMeta)
  const envBudgets = bind(g.envBudgets)
  const rawGoals = bind(g.rawGoals)
  const storedFxRates = bind(g.storedFxRates)
  const debtAccountId = bind(g.debtAccountId)
  const instrumentCodeById = bind(g.instrumentCodeById)
  const transactionsHistory = bind(g.transactionsHistory)
  const currentFxRates = memo(() =>
    buildCurrentFxRates({
      instruments: data.instrument,
      currentMonth: currentMonth(),
    })
  )
  const fxRates = memo(() =>
    buildFxRates({
      storedRates: storedFxRates(),
      currentRates: currentFxRates(),
    })
  )
  const fxRatesGetter = memo(() =>
    buildFxRatesGetter({
      rates: fxRates(),
      currentRates: currentFxRates(),
    })
  )
  const convertFx = memo(() => buildFxConverter(fxRatesGetter()))
  const debtors = memo(() =>
    buildDebtors({
      transactions: transactionsHistory(),
      merchants: data.merchant,
      instruments: data.instrument,
      debtAccountId: debtAccountId(),
    })
  )
  const envelopesCompiled = memo(() =>
    buildEnvelopes({
      debtors: debtors(),
      tags: data.tag,
      savingAccounts: g.savingAccounts(data),
      envelopeMeta: envelopeMeta(),
      userCurrency: g.userCurrency(data),
    })
  )
  const envelopes = memo(() => envelopesCompiled().byId)
  const envelopeStructure = memo(() => envelopesCompiled().structure)
  const keepingEnvelopeIds = memo(() => getKeepingEnvelopes(envelopes()))
  const budgets = memo(() =>
    buildBudgets({
      tagBudgets: g.tagBudgets(data),
      envBudgets: envBudgets(),
      preferZmBudgets: userSettings().preferZmBudgets,
    })
  )
  const monthList = memo(() =>
    buildMonthList({
      transactions: transactionsHistory(),
      budgets: budgets(),
      currentMonth: currentMonth(),
    })
  )
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
