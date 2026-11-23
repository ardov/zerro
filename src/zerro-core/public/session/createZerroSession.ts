import type { TCoreContext } from '../../types'
import type { TDataStore } from '../../internal/domain/zenmoney/model/store'
import {
  compileTransactionQuery,
  type TTransactionQuery,
} from '../../internal/domain/zerro/transactions/query'
import { createProjectionGraph } from '../../internal/projections/graph'

export type TZerroSession = ReturnType<typeof createZerroSession>

/** Bind shared graph reads to one immutable snapshot, grouped by domain. */
export function createZerroSession(data: TDataStore, ctx: TCoreContext) {
  // Freeze now() for this snapshot so its derived dates cannot drift during its lifetime.
  const frozenNow = ctx.now()
  const g = createProjectionGraph({ ...ctx, now: () => frozenNow })
  const bind =
    <T>(node: (snapshot: TDataStore) => T) =>
    () =>
      node(data)
  const queryTransactions = (query: TTransactionQuery) =>
    g
      .sortedTransactions(data)
      .filter(compileTransactionQuery(query, g.transactionQueryContext(data)))

  return {
    data,
    ctx,
    calendar: {
      getCurrentDate: g.currentDate,
      getCurrentMonth: g.currentMonth,
    },
    settings: {
      get: bind(g.userSettings),
    },
    transactions: {
      getHistory: bind(g.transactionsHistory),
      getHistoryStart: bind(g.historyStart),
      query: queryTransactions,
    },
    debtors: {
      getAll: bind(g.debtors),
    },
    accounts: {
      getCurrentFunds: bind(g.currentFunds),
    },
    envelopes: {
      getAll: bind(g.envelopes),
      getStructure: bind(g.envelopeStructure),
      getKeepingIds: bind(g.keepingEnvelopeIds),
      getMetrics: bind(g.envMetrics),
    },
    budgets: {
      getAll: bind(g.budgets),
    },
    activity: {
      getRoutingContext: bind(g.routingContext),
      getRaw: bind(g.rawActivity),
      getAll: bind(g.activity),
      getSorted: bind(g.sortedActivity),
    },
    months: {
      getList: bind(g.monthList),
      getTotals: bind(g.monthTotals),
    },
    goals: {
      getRaw: bind(g.rawGoals),
      getAll: bind(g.goals),
      getTotals: bind(g.goalTotals),
    },
    balances: {
      getAll: bind(g.balances),
      getByDate: bind(g.balancesByDate),
    },
    fx: {
      getCurrentRates: bind(g.currentFxRates),
      getRates: bind(g.fxRates),
    },
  }
}
