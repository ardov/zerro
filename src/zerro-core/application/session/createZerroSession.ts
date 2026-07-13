import { toISODate, toISOMonth } from '../../domain/shared/date'
import type { TDataStore } from '../../domain/zenmoney/store'
import {
  buildBalances,
  buildBalancesByDate,
  buildDebtors,
  buildTagStructure,
  getDebtAccountId,
  getHistoryStart,
  getInstCodeMap,
  getTagBudgets,
  getTransactionsHistory,
  getUserCurrency,
} from '../../domain/zenmoney'
import {
  buildActivity,
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
  getEnvBudgets,
  getEnvelopeMeta,
  getZerroInBudgetAccountIds,
  getZerroSavingAccounts,
  getStoredFxRates,
  getKeepingEnvelopes,
  getRawGoals,
  getUserSettings,
} from '../../domain/zerro'

export type TZerroSessionContext = {
  now: () => number
  uuid: () => string
}

export type TZerroSession = ReturnType<typeof createZerroSession>

export function createZerroSession(
  data: TDataStore,
  ctx: TZerroSessionContext
) {
  const currentDate = memo(() => toISODate(ctx.now()))
  const currentMonth = memo(() => toISOMonth(ctx.now()))
  const userSettings = memo(() => getUserSettings(data))
  const envelopeMeta = memo(() => getEnvelopeMeta(data))
  const envBudgets = memo(() => getEnvBudgets(data))
  const rawGoals = memo(() => getRawGoals(data))
  const storedFxRates = memo(() => getStoredFxRates(data))
  const debtAccountId = memo(() => getDebtAccountId(data))
  const instrumentCodeById = memo(() => getInstCodeMap(data))
  const transactionsHistory = memo(() => getTransactionsHistory(data))
  const tagStructure = memo(() => buildTagStructure({ tags: data.tag }))
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
      tags: tagStructure(),
      savingAccounts: getZerroSavingAccounts(data),
      envelopeMeta: envelopeMeta(),
      userCurrency: getUserCurrency(data),
    })
  )
  const envelopes = memo(() => envelopesCompiled().byId)
  const envelopeStructure = memo(() => envelopesCompiled().structure)
  const keepingEnvelopeIds = memo(() => getKeepingEnvelopes(envelopes()))
  const budgets = memo(() =>
    buildBudgets({
      tagBudgets: getTagBudgets(data),
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
  const inBudgetAccountIds = memo(() => getZerroInBudgetAccountIds(data))
  const currentFunds = memo(() =>
    buildCurrentFunds({
      accounts: data.account,
      inBudgetIds: inBudgetAccountIds(),
      instrumentCodeById: instrumentCodeById(),
    })
  )
  const rawActivity = memo(() =>
    buildRawActivity({
      transactions: transactionsHistory(),
      inBudgetAccountIds: inBudgetAccountIds(),
      debtAccountId: debtAccountId(),
      debtors: debtors(),
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
  const historyStart = memo(() =>
    getHistoryStart(transactionsHistory(), currentDate())
  )
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
