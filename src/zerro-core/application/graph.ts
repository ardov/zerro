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
  getTagBudgets,
  getTransactionIds,
  getTransactionsHistory,
  getUserCurrency,
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
 * memo entry there costs more than the call it saves. See the cost census in
 * documents/design-ledger.md.
 */
export function createProjectionGraph(ctx: TCoreContext) {
  // Called per read, never captured: the Redux instance lives for the whole
  // app session and would otherwise freeze the month at import time.
  const currentMonth = () => toISOMonth(ctx.now())
  const currentDate = () => toISODate(ctx.now())

  // --- pass-through and primitive nodes: no memo ---------------------------
  const debtAccountId = (d: TDataStore) => getDebtAccountId(d)
  const userCurrency = (d: TDataStore) => getUserCurrency(d)
  const historyStart = (d: TDataStore) =>
    getHistoryStart(transactionsHistory(d), currentDate())

  // --- memoized because they allocate or cost ------------------------------
  const transactionsHistory = memoOn(
    (d: TDataStore) => [d.transaction] as const,
    transaction => getTransactionsHistory({ transaction })
  )
  const transactionIds = memoOn(
    (d: TDataStore) => [d.transaction] as const,
    transaction => getTransactionIds({ transaction })
  )
  const instrumentCodeById = memoOn(
    (d: TDataStore) => [d.instrument] as const,
    instrument => getInstCodeMap({ instrument })
  )
  const userSettings = memoOn(
    (d: TDataStore) => [d.reminder] as const,
    reminder => getUserSettings({ reminder })
  )
  const envelopeMeta = memoOn(
    (d: TDataStore) => [d.reminder] as const,
    reminder => getEnvelopeMeta({ reminder })
  )
  const envBudgets = memoOn(
    (d: TDataStore) => [d.reminder] as const,
    reminder => getEnvBudgets({ reminder })
  )
  const rawGoals = memoOn(
    (d: TDataStore) => [d.reminder] as const,
    reminder => getRawGoals({ reminder })
  )
  const storedFxRates = memoOn(
    (d: TDataStore) => [d.reminder] as const,
    reminder => getStoredFxRates({ reminder })
  )
  const tagBudgets = memoOn(
    (d: TDataStore) => [d.budget] as const,
    budget => getTagBudgets({ budget })
  )
  const savingAccounts = memoOn(
    (d: TDataStore) => [d.account] as const,
    account => getZerroSavingAccounts({ account })
  )
  // Result equality matters here: this list is rebuilt from the whole account
  // map, and every account edit would otherwise invalidate the activity chain.
  const inBudgetAccountIds = memoOn(
    (d: TDataStore) => [d.account] as const,
    account => getZerroInBudgetAccountIds({ account }),
    sameItems
  )

  // --- fx ------------------------------------------------------------------
  const currentFxRates = memoOn(
    (d: TDataStore) => [d.instrument, currentMonth()] as const,
    (instruments, currentMonth) =>
      buildCurrentFxRates({ instruments, currentMonth })
  )
  const fxRates = memoOn(
    (d: TDataStore) => [storedFxRates(d), currentFxRates(d)] as const,
    (storedRates, currentRates) => buildFxRates({ storedRates, currentRates })
  )
  const fxRatesGetter = memoOn(
    (d: TDataStore) => [fxRates(d), currentFxRates(d)] as const,
    (rates, currentRates) => buildFxRatesGetter({ rates, currentRates })
  )
  const convertFx = memoOn(
    (d: TDataStore) => [fxRatesGetter(d)] as const,
    buildFxConverter
  )

  // --- debtors -------------------------------------------------------------
  const debtors = memoOn(
    (d: TDataStore) =>
      [
        transactionsHistory(d),
        d.merchant,
        d.instrument,
        debtAccountId(d),
      ] as const,
    (transactions, merchants, instruments, debtAccountId) =>
      buildDebtors({ transactions, merchants, instruments, debtAccountId })
  )

  // --- envelopes (domain only; presentation stays in the adapter) ----------
  const envelopesCompiled = memoOn(
    (d: TDataStore) =>
      [
        debtors(d),
        d.tag,
        savingAccounts(d),
        envelopeMeta(d),
        userCurrency(d),
      ] as const,
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
  const envelopes = (d: TDataStore) => envelopesCompiled(d).byId
  const envelopeStructure = (d: TDataStore) => envelopesCompiled(d).structure
  const keepingEnvelopeIds = memoOn(
    (d: TDataStore) => [envelopes(d)] as const,
    getKeepingEnvelopes
  )

  // --- budgets and month list ----------------------------------------------
  const budgets = memoOn(
    (d: TDataStore) =>
      [tagBudgets(d), envBudgets(d), userSettings(d).preferZmBudgets] as const,
    (tagBudgets, envBudgets, preferZmBudgets) =>
      buildBudgets({ tagBudgets, envBudgets, preferZmBudgets })
  )
  const monthList = memoOn(
    (d: TDataStore) =>
      [transactionsHistory(d), budgets(d), currentMonth()] as const,
    (transactions, budgets, currentMonth) =>
      buildMonthList({ transactions, budgets, currentMonth })
  )

  // --- activity chain (the expensive nodes) --------------------------------
  const currentFunds = memoOn(
    (d: TDataStore) =>
      [d.account, inBudgetAccountIds(d), instrumentCodeById(d)] as const,
    (accounts, inBudgetIds, instrumentCodeById) =>
      buildCurrentFunds({ accounts, inBudgetIds, instrumentCodeById })
  )
  const routingContext = memoOn(
    (d: TDataStore) =>
      [inBudgetAccountIds(d), debtAccountId(d), debtors(d)] as const,
    (inBudgetAccountIds, debtAccountId, debtors) =>
      buildActivityRoutingContext({
        inBudgetAccountIds,
        debtAccountId,
        debtors,
      })
  )
  const rawActivity = memoOn(
    (d: TDataStore) =>
      [transactionsHistory(d), routingContext(d), d.instrument] as const,
    (transactions, routing, instruments) =>
      buildRawActivity({ transactions, routing, instruments })
  )
  const activity = memoOn(
    (d: TDataStore) => [rawActivity(d), keepingEnvelopeIds(d)] as const,
    (rawActivity, keepingEnvelopeIds) =>
      buildActivity({ rawActivity, keepingEnvelopeIds })
  )
  const envMetrics = memoOn(
    (d: TDataStore) =>
      [
        monthList(d),
        envelopes(d),
        activity(d),
        budgets(d),
        convertFx(d),
      ] as const,
    (monthList, envelopes, activity, budgets, convertFx) =>
      buildEnvMetrics({ monthList, envelopes, activity, budgets, convertFx })
  )
  const sortedActivity = memoOn(
    (d: TDataStore) =>
      [rawActivity(d), keepingEnvelopeIds(d), convertFx(d)] as const,
    (rawActivity, keepingEnvelopeIds, convertFx) =>
      buildSortedActivity({ rawActivity, keepingEnvelopeIds, convertFx })
  )
  const monthTotals = memoOn(
    (d: TDataStore) =>
      [
        monthList(d),
        currentFunds(d),
        activity(d),
        envMetrics(d),
        convertFx(d),
        currentMonth(),
      ] as const,
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
  const goals = memoOn(
    (d: TDataStore) =>
      [
        rawGoals(d),
        monthList(d),
        envMetrics(d),
        sortedActivity(d),
        convertFx(d),
      ] as const,
    (rawGoals, monthList, envMetrics, sortedActivity, convertFx) =>
      buildGoals({ rawGoals, monthList, envMetrics, sortedActivity, convertFx })
  )
  const goalTotals = memoOn(
    (d: TDataStore) => [goals(d), convertFx(d)] as const,
    buildGoalTotals
  )

  // --- balances ------------------------------------------------------------
  const balances = memoOn(
    (d: TDataStore) =>
      [
        transactionsHistory(d),
        d.account,
        debtors(d),
        d.merchant,
        instrumentCodeById(d),
        debtAccountId(d),
      ] as const,
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
  const balancesByDate = memoOn(
    (d: TDataStore) => [balances(d), historyStart(d), currentDate()] as const,
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
