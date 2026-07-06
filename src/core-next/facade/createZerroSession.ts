import { toISODate, toISOMonth } from '6-shared/helpers/date'
import { ZERRO_DATA_ACCOUNT_NAME } from '../constants'
import type {
  AccountType,
  ById,
  TAccount,
  TAccountId,
  TDataStore,
  TFxCode,
  TTransaction,
} from '6-shared/types'
import { AccountType as AccountTypeValue } from '6-shared/types'
import {
  buildBalances,
  buildBalancesByDate,
  buildDebtors,
  compareTransactionDates,
  getHistoryStart,
  getInstrumentCodeById,
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
import type { TBuildEnvelopesInput, TEnvelopeTag } from '../zerro/envelopes'

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
  const instrumentCodeById = memo(() => getInstrumentCodeById(data))
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
      tagBudgets: data.budget,
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
  const currentFunds = memo(() => buildCurrentFunds(getInBudgetAccounts(data)))
  const rawActivity = memo(() =>
    buildRawActivity({
      transactions: transactionsHistory(),
      inBudgetAccountIds: getInBudgetAccounts(data).map(account => account.id),
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
      accounts: getBalanceAccounts(data),
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

function getTransactionsHistory(data: TDataStore): TTransaction[] {
  return Object.values(data.transaction)
    .filter(transaction => !isDeletedTransaction(transaction))
    .sort(compareTransactionDates)
    .reverse()
}

function isDeletedTransaction(transaction: TTransaction) {
  if (transaction.deleted) return true
  if (transaction.income < 0.0001 && transaction.outcome < 0.0001) return true
  return false
}

function getDebtAccountId(data: TDataStore): TAccountId | undefined {
  return Object.values(data.account).find(
    account => account.type === AccountTypeValue.Debt
  )?.id
}

function getSavingAccounts(
  data: TDataStore
): TBuildEnvelopesInput['savingAccounts'] {
  return Object.values(data.account).filter(
    account =>
      !isInBudget(account) &&
      account.type !== AccountTypeValue.Debt &&
      account.title !== ZERRO_DATA_ACCOUNT_NAME
  )
}

function getInBudgetAccounts(data: TDataStore) {
  const instrumentCodeById = getInstrumentCodeById(data)
  return Object.values(data.account)
    .filter(isInBudget)
    .map(account => ({
      id: account.id,
      balance: account.balance,
      fxCode: instrumentCodeById[account.instrument],
    }))
}

function getBalanceAccounts(data: TDataStore) {
  const instrumentCodeById = getInstrumentCodeById(data)
  const result: ById<{
    id: TAccountId
    type: AccountType
    fxCode: TFxCode
    balance: number
  }> = {}

  Object.values(data.account).forEach(account => {
    result[account.id] = {
      id: account.id,
      type: account.type,
      fxCode: instrumentCodeById[account.instrument],
      balance: account.balance,
    }
  })

  return result
}

function isInBudget(account: TAccount): boolean {
  if (account.type === AccountTypeValue.Debt) return false
  if (account.title.endsWith('📍')) return true
  return account.inBalance
}
