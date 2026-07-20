import { toISODate, toISOMonth } from '../domain/shared/date'
import type { TDataStore } from '../domain/zenmoney/store'
import type { TCoreContext } from '../types'
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
import { memoOn, sameItems } from './memo'

/** A projection: one value derived from a snapshot. */
type TNode<T> = (data: TDataStore) => T

/**
 * A memoized node. Pins {@link memoOn}'s input to `TDataStore` so a node's
 * dependency selector infers `data` and returns a tuple without a `: TDataStore`
 * annotation or an `as const` at every call site.
 */
function node<TDeps extends readonly unknown[], TResult>(
  selectDeps: (data: TDataStore) => readonly [...TDeps],
  compute: (...deps: TDeps) => TResult,
  isEqualResult?: (previous: TResult, next: TResult) => boolean
): TNode<TResult> {
  return memoOn(selectDeps, compute, isEqualResult)
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
  const sortedTransactions = node(
    d => [d.transaction],
    transaction => getSortedTransactions({ transaction })
  )
  const transactionsHistory = node(
    d => [sortedTransactions(d)],
    toTransactionHistory
  )
  const transactionIds = node(d => [sortedTransactions(d)], toTransactionIds)

  // --- reads off a single entity map ---------------------------------------
  const instrumentCodeById = node(
    d => [d.instrument],
    instrument => getInstCodeMap({ instrument })
  )
  const userSettings = node(
    d => [d.reminder],
    reminder => getUserSettings({ reminder })
  )
  const envelopeMeta = node(
    d => [d.reminder],
    reminder => getEnvelopeMeta({ reminder })
  )
  const envBudgets = node(
    d => [d.reminder],
    reminder => getEnvBudgets({ reminder })
  )
  const rawGoals = node(
    d => [d.reminder],
    reminder => getRawGoals({ reminder })
  )
  const storedFxRates = node(
    d => [d.reminder],
    reminder => getStoredFxRates({ reminder })
  )
  const tagBudgets = node(
    d => [d.budget],
    budget => getTagBudgets({ budget })
  )
  const savingAccounts = node(
    d => [d.account],
    account => getZerroSavingAccounts({ account })
  )
  // Result equality matters here: this list is rebuilt from the whole account
  // map, and every account edit would otherwise invalidate the activity chain.
  const inBudgetAccountIds = node(
    d => [d.account],
    account => getZerroInBudgetAccountIds({ account }),
    sameItems
  )

  // --- fx ------------------------------------------------------------------
  const currentFxRates = node(
    d => [d.instrument, currentMonth()],
    (instruments, currentMonth) =>
      buildCurrentFxRates({ instruments, currentMonth })
  )
  const fxRates = node(
    d => [storedFxRates(d), currentFxRates(d)],
    (storedRates, currentRates) => buildFxRates({ storedRates, currentRates })
  )
  const fxRatesGetter = node(
    d => [fxRates(d), currentFxRates(d)],
    (rates, currentRates) => buildFxRatesGetter({ rates, currentRates })
  )
  const convertFx = node(d => [fxRatesGetter(d)], buildFxConverter)

  // --- debtors -------------------------------------------------------------
  const debtors = node(
    d => [transactionsHistory(d), d.merchant, d.instrument, debtAccountId(d)],
    (transactions, merchants, instruments, debtAccountId) =>
      buildDebtors({ transactions, merchants, instruments, debtAccountId })
  )

  // --- envelopes (domain only; presentation stays in the adapter) ----------
  const envelopesCompiled = node(
    d => [
      debtors(d),
      d.tag,
      savingAccounts(d),
      envelopeMeta(d),
      userCurrency(d),
    ],
    (debtors, tags, savingAccounts, envelopeMeta, userCurrency) =>
      buildEnvelopes({
        debtors,
        tags,
        savingAccounts,
        envelopeMeta,
        userCurrency,
      })
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
  const budgets = node(
    d => [tagBudgets(d), envBudgets(d), userSettings(d).preferZmBudgets],
    (tagBudgets, envBudgets, preferZmBudgets) =>
      buildBudgets({ tagBudgets, envBudgets, preferZmBudgets })
  )
  const monthList = node(
    d => [transactionsHistory(d), budgets(d), currentMonth()],
    (transactions, budgets, currentMonth) =>
      buildMonthList({ transactions, budgets, currentMonth })
  )

  // --- activity chain (the expensive nodes) --------------------------------
  const currentFunds = node(
    d => [d.account, inBudgetAccountIds(d), instrumentCodeById(d)],
    (accounts, inBudgetIds, instrumentCodeById) =>
      buildCurrentFunds({ accounts, inBudgetIds, instrumentCodeById })
  )
  const routingContext = node(
    d => [inBudgetAccountIds(d), debtAccountId(d), debtors(d)],
    (inBudgetAccountIds, debtAccountId, debtors) =>
      buildActivityRoutingContext({
        inBudgetAccountIds,
        debtAccountId,
        debtors,
      })
  )
  const rawActivity = node(
    d => [transactionsHistory(d), routingContext(d), d.instrument],
    (transactions, routing, instruments) =>
      buildRawActivity({ transactions, routing, instruments })
  )
  const activity = node(
    d => [rawActivity(d), keepingEnvelopeIds(d)],
    (rawActivity, keepingEnvelopeIds) =>
      buildActivity({ rawActivity, keepingEnvelopeIds })
  )
  const envMetrics = node(
    d => [monthList(d), envelopes(d), activity(d), budgets(d), convertFx(d)],
    (monthList, envelopes, activity, budgets, convertFx) =>
      buildEnvMetrics({ monthList, envelopes, activity, budgets, convertFx })
  )
  const sortedActivity = node(
    d => [rawActivity(d), keepingEnvelopeIds(d), convertFx(d)],
    (rawActivity, keepingEnvelopeIds, convertFx) =>
      buildSortedActivity({ rawActivity, keepingEnvelopeIds, convertFx })
  )
  const monthTotals = node(
    d => [
      monthList(d),
      currentFunds(d),
      activity(d),
      envMetrics(d),
      convertFx(d),
      currentMonth(),
    ],
    (monthList, currentFunds, activity, envMetrics, convertFx, currentMonth) =>
      buildMonthTotals({
        monthList,
        currentFunds,
        activity,
        envMetrics,
        convertFx,
        currentMonth,
      })
  )

  // --- goals ---------------------------------------------------------------
  const goals = node(
    d => [
      rawGoals(d),
      monthList(d),
      envMetrics(d),
      sortedActivity(d),
      convertFx(d),
    ],
    (rawGoals, monthList, envMetrics, sortedActivity, convertFx) =>
      buildGoals({ rawGoals, monthList, envMetrics, sortedActivity, convertFx })
  )
  const goalTotals = node(d => [goals(d), convertFx(d)], buildGoalTotals)

  // --- balances ------------------------------------------------------------
  const balances = node(
    d => [
      transactionsHistory(d),
      d.account,
      debtors(d),
      d.merchant,
      instrumentCodeById(d),
      debtAccountId(d),
    ],
    (
      transactions,
      accounts,
      debtors,
      merchants,
      instrumentCodeById,
      debtAccountId
    ) =>
      buildBalances({
        transactions,
        accounts,
        debtors,
        merchants,
        instrumentCodeById,
        debtAccountId,
      })
  )
  const balancesByDate = node(
    d => [balances(d), historyStart(d), currentDate()],
    (balances, historyStart, currentDate) =>
      buildBalancesByDate({ balances, historyStart, currentDate })
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
