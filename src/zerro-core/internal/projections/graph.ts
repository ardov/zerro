import { toISODate, toISOMonth } from '../domain/foundation/date'
import type { TDataStore, TFxCode, TISODate } from '../domain/zenmoney'
import type { TCoreContext } from '../../types'
import type { ById } from '../domain/foundation/types'
import type { TTransactionQueryContext } from '../domain/zerro/transactions'
import {
  buildBalances,
  buildBalancesByDate,
  buildDebtors,
  buildDebtorNames,
  buildMerchantUsage,
  getDebtAccountId,
  getBalancesAtDate,
  getHistoryStart,
  getInstCodeMap,
  getSortedTransactions,
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
  sameMetricEnvelopes,
  type TMetricEnvelope,
} from '../domain/zerro'
import { memoOn, memoOnObject, sameItems, sameRecord, sameSet } from './memo'

type TNode<T> = (data: TDataStore) => T

function node<TDeps extends readonly unknown[], TResult>(
  selectDeps: (data: TDataStore) => readonly [...TDeps],
  compute: (...deps: TDeps) => TResult,
  isEqualResult?: (previous: TResult, next: TResult) => boolean
): TNode<TResult> {
  return memoOn(selectDeps, compute, isEqualResult)
}

function nodeObj<TArg extends Record<string, unknown>, TResult>(
  selectArg: (data: TDataStore) => TArg,
  compute: (arg: TArg) => TResult,
  isEqualResult?: (previous: TResult, next: TResult) => boolean
): TNode<TResult> {
  return memoOnObject(selectArg, compute, isEqualResult)
}

/** Share this graph between long-lived Redux and snapshot sessions; keep runtime dependencies out.
 * Memoize expensive work and allocations, not primitives or store maps returned as-is. */
export function createProjectionGraph(ctx: TCoreContext) {
  // Called per read, never captured: the Redux instance lives for the whole
  // app session and would otherwise freeze the month at import time.
  const currentMonth = () => toISOMonth(ctx.now())
  const currentDate = () => toISODate(ctx.now())

  const debtAccountId: TNode<ReturnType<typeof getDebtAccountId>> = d =>
    getDebtAccountId(d.account)
  // Runs inside the dependency check of every envelope read, so it reads the
  // memoized code map rather than building one.
  const userCurrency: TNode<TFxCode> = d =>
    getUserCurrency({ users: d.user, instrumentCodes: instrumentCodeById(d) })
  const historyStart: TNode<ReturnType<typeof getHistoryStart>> = d =>
    getHistoryStart(transactionsHistory(d), currentDate())

  const sortedTransactions = node(d => [d.transaction], getSortedTransactions)
  const transactionsHistory = node(
    d => [sortedTransactions(d)],
    toTransactionHistory
  )
  const transactionIds = node(d => [sortedTransactions(d)], toTransactionIds)

  const instrumentCodeById = node(d => [d.instrument], getInstCodeMap)
  const userSettings = node(d => [d.reminder], getUserSettings)
  const envelopeMeta = node(d => [d.reminder], getEnvelopeMeta)
  const envBudgets = node(d => [d.reminder], getEnvBudgets)
  const rawGoals = node(d => [d.reminder], getRawGoals)
  const storedFxRates = node(d => [d.reminder], getStoredFxRates)
  const tagBudgets: TNode<TDataStore['budget']> = d => d.budget
  const savingAccounts = node(d => [d.account], getZerroSavingAccounts)
  // Result equality matters here: this list is rebuilt from the whole account
  // map, and every account edit would otherwise invalidate the activity chain.
  const inBudgetAccountIds = node(
    d => [d.account],
    getZerroInBudgetAccountIds,
    sameItems
  )

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

  const debtors = nodeObj(
    d => ({
      transactions: transactionsHistory(d),
      merchants: d.merchant,
      instruments: d.instrument,
      debtAccountId: debtAccountId(d),
    }),
    buildDebtors
  )

  const debtorNames = nodeObj(
    d => ({
      transactions: sortedTransactions(d),
      merchants: d.merchant,
      debtAccountId: debtAccountId(d),
    }),
    buildDebtorNames
  )

  const merchantUsage = nodeObj(
    d => ({
      transactions: transactionsHistory(d),
      currentDate: currentDate(),
      debtAccountId: debtAccountId(d),
    }),
    buildMerchantUsage
  )

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
  const keepingEnvelopeIds = node(
    d => [envelopes(d)],
    getKeepingEnvelopes,
    sameSet
  )
  const envelopeCurrencies = node(
    d => [envelopes(d)],
    envelopes =>
      Object.fromEntries(
        Object.values(envelopes).map(({ id, currency }) => [id, currency])
      ),
    sameRecord
  )
  const metricEnvelopes = node(
    d => [envelopes(d)],
    (envelopes): ById<TMetricEnvelope> => envelopes,
    sameMetricEnvelopes
  )

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
      historyStart: historyStart(d),
      budgets: budgets(d),
      currentMonth: currentMonth(),
    }),
    buildMonthList
  )

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
  const transactionQueryContext = node(
    d => [
      routingContext(d),
      envelopes(d),
      keepingEnvelopeIds(d),
      d.account,
      d.tag,
      d.merchant,
      instrumentCodeById(d),
    ],
    (
      routing,
      envelopes,
      keepingEnvelopeIds,
      accounts,
      tags,
      merchants,
      instrumentCodeById
    ): TTransactionQueryContext => ({
      routing,
      envelopes,
      keepingEnvelopeIds,
      instrumentCodeById,
      search: { accounts, tags, merchants },
    })
  )
  const rawActivity = nodeObj(
    d => ({
      transactions: transactionsHistory(d),
      routing: routingContext(d),
      instruments: d.instrument,
      envelopeCurrencies: envelopeCurrencies(d),
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
      envelopes: metricEnvelopes(d),
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

  const balanceInputs = (d: TDataStore) => ({
    transactions: transactionsHistory(d),
    accounts: d.account,
    debtors: debtors(d),
    merchants: d.merchant,
    instrumentCodeById: instrumentCodeById(d),
    debtAccountId: debtAccountId(d),
  })
  const balances = nodeObj(balanceInputs, buildBalances)
  const balancesAtDate = nodeObj(
    balanceInputs,
    input => (date: TISODate) => getBalancesAtDate(input, date)
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
    sortedTransactions,
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
    debtorNames,
    merchantUsage,
    envelopes,
    envelopeStructure,
    keepingEnvelopeIds,
    budgets,
    monthList,
    currentFunds,
    routingContext,
    transactionQueryContext,
    rawActivity,
    activity,
    envMetrics,
    sortedActivity,
    monthTotals,
    goals,
    goalTotals,
    balances,
    balancesAtDate,
    balancesByDate,
  }
}
