import { toISODate, toISOMonth } from '../domain/foundation/date'
import type { TDataStore } from '../domain/zenmoney'
import type { TCoreContext } from '../../types'
import {
  buildBalances,
  buildBalancesByDate,
  buildDebtors,
  getDebtAccountId,
  getHistoryStart,
  getInstCodeMap,
  getSortedTransactions,
  getTagBudgets,
  getUserCurrency,
  toTransactionHistory,
  toTransactionIds,
} from '../domain/zenmoney'
import {
  buildActivity,
  buildActivityRoutingContext,
  buildBudgets,
  buildCurrentFunds,
  buildCurrentFxRates,
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
  getEnvBudgets,
  getEnvelopeMeta,
  getKeepingEnvelopes,
  getRawGoals,
  getStoredFxRates,
  getUserSettings,
  getZerroInBudgetAccountIds,
  getZerroSavingAccounts,
} from '../domain/zerro'
import { memoOn, memoOnObject, sameItems } from './memo'

/** A projection: one value derived from a snapshot. */
type TNode<T> = (data: TDataStore) => T

/**
 * A memoized node from a dependency tuple. Pins the memo's input to
 * `TDataStore` so the dependency selector infers `data` and returns a tuple
 * without a `: TDataStore` annotation or an `as const` at every call site. Use
 * for a compute that takes its dependencies positionally.
 */
function node<TDeps extends readonly unknown[], TResult>(
  selectDeps: (data: TDataStore) => readonly [...TDeps],
  compute: (...deps: TDeps) => TResult,
  isEqualResult?: (previous: TResult, next: TResult) => boolean
): TNode<TResult> {
  return memoOn(selectDeps, compute, isEqualResult)
}

/**
 * A memoized node from a named-dependency object. The object matches the
 * compute's parameter, so the compute is the bare `build*`/`get*` function and
 * each dependency is named once, by key. Use for the object-parameter domain
 * functions.
 */
function nodeObj<TArg extends Record<string, unknown>, TResult>(
  selectArg: (data: TDataStore) => TArg,
  compute: (arg: TArg) => TResult,
  isEqualResult?: (previous: TResult, next: TResult) => boolean
): TNode<TResult> {
  return memoOnObject(selectArg, compute, isEqualResult)
}

/**
 * The projection dependency graph, defined once.
 *
 * Both runtimes instantiate it: the Redux adapter keeps one instance per app
 * so each node memoizes across snapshots, and `createZerroSession` keeps one
 * per snapshot so each node is computed at most once for that session. Nothing
 * here may read Redux, React, i18n, or storage — presentation and hooks stay
 * in the adapter.
 *
 * Not every node is memoized. A node earns its memo entry only if it allocates
 * something a dependent reads, or if it is expensive. Nodes returning a
 * primitive or passing a store map straight through are plain functions: a
 * memo entry there costs more than the call it saves. The cost census behind
 * this split is in documents/design-ledger.md (Reads and Redux adapter).
 */
export function createProjectionGraph(ctx: TCoreContext) {
  // Called per read, never captured: the Redux instance lives for the whole
  // app session and would otherwise freeze the month at import time.
  const currentMonth = () => toISOMonth(ctx.now())
  const currentDate = () => toISODate(ctx.now())

  // --- pass-through and primitive nodes: no memo ---------------------------
  const debtAccountId: TNode<ReturnType<typeof getDebtAccountId>> =
    getDebtAccountId
  const userCurrency: TNode<ReturnType<typeof getUserCurrency>> =
    getUserCurrency
  const historyStart: TNode<ReturnType<typeof getHistoryStart>> = d =>
    getHistoryStart(transactionsHistory(d), currentDate())

  // --- transactions: one sort, two slices ----------------------------------
  const sortedTransactions = nodeObj(
    d => ({ transaction: d.transaction }),
    getSortedTransactions
  )
  const transactionsHistory = node(
    d => [sortedTransactions(d)],
    toTransactionHistory
  )
  const transactionIds = node(d => [sortedTransactions(d)], toTransactionIds)

  // --- reads off a single entity map ---------------------------------------
  const instrumentCodeById = nodeObj(
    d => ({ instrument: d.instrument }),
    getInstCodeMap
  )
  const userSettings = nodeObj(d => ({ reminder: d.reminder }), getUserSettings)
  const envelopeMeta = nodeObj(d => ({ reminder: d.reminder }), getEnvelopeMeta)
  const envBudgets = nodeObj(d => ({ reminder: d.reminder }), getEnvBudgets)
  const rawGoals = nodeObj(d => ({ reminder: d.reminder }), getRawGoals)
  const storedFxRates = nodeObj(
    d => ({ reminder: d.reminder }),
    getStoredFxRates
  )
  const tagBudgets = nodeObj(d => ({ budget: d.budget }), getTagBudgets)
  const savingAccounts = nodeObj(
    d => ({ account: d.account }),
    getZerroSavingAccounts
  )
  // Result equality matters here: this list is rebuilt from the whole account
  // map, and every account edit would otherwise invalidate the activity chain.
  const inBudgetAccountIds = nodeObj(
    d => ({ account: d.account }),
    getZerroInBudgetAccountIds,
    sameItems
  )

  // --- fx ------------------------------------------------------------------
  const currentFxRates = nodeObj(
    d => ({ instruments: d.instrument, currentMonth: currentMonth() }),
    buildCurrentFxRates
  )
  const fxRates = nodeObj(
    d => ({ storedRates: storedFxRates(d), currentRates: currentFxRates(d) }),
    buildFxRates
  )
  const fxRatesGetter = nodeObj(
    d => ({ rates: fxRates(d), currentRates: currentFxRates(d) }),
    buildFxRatesGetter
  )
  const convertFx = node(d => [fxRatesGetter(d)], buildFxConverter)

  // --- debtors -------------------------------------------------------------
  const debtors = nodeObj(
    d => ({
      transactions: transactionsHistory(d),
      merchants: d.merchant,
      instruments: d.instrument,
      debtAccountId: debtAccountId(d),
    }),
    buildDebtors
  )

  // --- envelopes (domain only; presentation stays in the adapter) ----------
  const envelopesCompiled = nodeObj(
    d => ({
      debtors: debtors(d),
      tags: d.tag,
      savingAccounts: savingAccounts(d),
      envelopeMeta: envelopeMeta(d),
      userCurrency: userCurrency(d),
    }),
    buildEnvelopes
  )
  // Pass-through: the parent object is memoized, so its fields are already
  // reference-stable.
  const envelopes: TNode<ReturnType<typeof envelopesCompiled>['byId']> = d =>
    envelopesCompiled(d).byId
  const envelopeStructure: TNode<
    ReturnType<typeof envelopesCompiled>['structure']
  > = d => envelopesCompiled(d).structure
  const keepingEnvelopeIds = node(d => [envelopes(d)], getKeepingEnvelopes)

  // --- budgets and month list ----------------------------------------------
  const budgets = nodeObj(
    d => ({
      tagBudgets: tagBudgets(d),
      envBudgets: envBudgets(d),
      preferZmBudgets: userSettings(d).preferZmBudgets,
    }),
    buildBudgets
  )
  const monthList = nodeObj(
    d => ({
      transactions: transactionsHistory(d),
      budgets: budgets(d),
      currentMonth: currentMonth(),
    }),
    buildMonthList
  )

  // --- activity chain (the expensive nodes) --------------------------------
  const currentFunds = nodeObj(
    d => ({
      accounts: d.account,
      inBudgetIds: inBudgetAccountIds(d),
      instrumentCodeById: instrumentCodeById(d),
    }),
    buildCurrentFunds
  )
  const routingContext = nodeObj(
    d => ({
      inBudgetAccountIds: inBudgetAccountIds(d),
      debtAccountId: debtAccountId(d),
      debtors: debtors(d),
    }),
    buildActivityRoutingContext
  )
  const rawActivity = nodeObj(
    d => ({
      transactions: transactionsHistory(d),
      routing: routingContext(d),
      instruments: d.instrument,
    }),
    buildRawActivity
  )
  const activity = nodeObj(
    d => ({
      rawActivity: rawActivity(d),
      keepingEnvelopeIds: keepingEnvelopeIds(d),
    }),
    buildActivity
  )
  const envMetrics = nodeObj(
    d => ({
      monthList: monthList(d),
      envelopes: envelopes(d),
      activity: activity(d),
      budgets: budgets(d),
      convertFx: convertFx(d),
    }),
    buildEnvMetrics
  )
  const sortedActivity = nodeObj(
    d => ({
      rawActivity: rawActivity(d),
      keepingEnvelopeIds: keepingEnvelopeIds(d),
      convertFx: convertFx(d),
    }),
    buildSortedActivity
  )
  const monthTotals = nodeObj(
    d => ({
      monthList: monthList(d),
      currentFunds: currentFunds(d),
      activity: activity(d),
      envMetrics: envMetrics(d),
      convertFx: convertFx(d),
      currentMonth: currentMonth(),
    }),
    buildMonthTotals
  )

  // --- goals ---------------------------------------------------------------
  const goals = nodeObj(
    d => ({
      rawGoals: rawGoals(d),
      monthList: monthList(d),
      envMetrics: envMetrics(d),
      sortedActivity: sortedActivity(d),
      convertFx: convertFx(d),
    }),
    buildGoals
  )
  const goalTotals = node(d => [goals(d), convertFx(d)], buildGoalTotals)

  // --- balances ------------------------------------------------------------
  const balances = nodeObj(
    d => ({
      transactions: transactionsHistory(d),
      accounts: d.account,
      debtors: debtors(d),
      merchants: d.merchant,
      instrumentCodeById: instrumentCodeById(d),
      debtAccountId: debtAccountId(d),
    }),
    buildBalances
  )
  const balancesByDate = nodeObj(
    d => ({
      balances: balances(d),
      historyStart: historyStart(d),
      currentDate: currentDate(),
    }),
    buildBalancesByDate
  )

  return {
    currentMonth,
    currentDate,
    debtAccountId,
    userCurrency,
    historyStart,
    transactionsHistory,
    transactionIds,
    instrumentCodeById,
    userSettings,
    envelopeMeta,
    envBudgets,
    rawGoals,
    storedFxRates,
    tagBudgets,
    savingAccounts,
    inBudgetAccountIds,
    currentFxRates,
    fxRates,
    fxRatesGetter,
    convertFx,
    debtors,
    envelopes,
    envelopeStructure,
    keepingEnvelopeIds,
    budgets,
    monthList,
    currentFunds,
    routingContext,
    rawActivity,
    activity,
    envMetrics,
    sortedActivity,
    monthTotals,
    goals,
    goalTotals,
    balances,
    balancesByDate,
  }
}
