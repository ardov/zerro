import { toISODate, toISOMonth } from '6-shared/helpers/date'
import type { ById, TDataStore } from '6-shared/types'
import {
  buildBalances,
  buildBalancesByDate,
  buildDebtors,
  getDebtAccountId,
  getHistoryStart,
  getInBudgetAccountIds,
  getInstCodeMap,
  getTagBudgets,
  getSavingAccounts,
  getTransactionsHistory,
  getUserCurrency,
} from '../zenmoney'
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
  getStoredFxRates,
  getKeepingEnvelopes,
  getRawGoals,
  getUserSettings,
} from '../zerro'
import type { TEnvelopeTag } from '../zerro/envelopes'

export type TZerroSessionContext = {
  now: () => number
  uuid: () => string
}

export type TZerroSessionReadDependencies = {
  populatedTags: ById<TEnvelopeTag>
}

export type TZerroSession = ReturnType<typeof createZerroSession>

export function createZerroSession(
  data: TDataStore,
  ctx: TZerroSessionContext,
  dependencies: TZerroSessionReadDependencies
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
      populatedTags: dependencies.populatedTags,
      savingAccounts: getSavingAccounts(data),
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
  const inBudgetAccountIds = memo(() => getInBudgetAccountIds(data))
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
  const read = {
    currentDate,
    currentMonth,
    userSettings,
    envelopeMeta,
    envBudgets,
    rawGoals,
    storedFxRates,
    currentFxRates,
    fxRates,
    fxRatesGetter,
    convertFx,
    debtAccountId,
    instrumentCodeById,
    transactionsHistory,
    debtors,
    envelopesCompiled,
    envelopes,
    envelopeStructure,
    keepingEnvelopeIds,
    budgets,
    monthList,
    currentFunds,
    rawActivity,
    activity,
    envMetrics,
    sortedActivity,
    monthTotals,
    goals,
    goalTotals,
    historyStart,
    balances,
    balancesByDate,
  }

  return { data, ctx, read }
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
