import { toISODate, toISOMonth } from '../domain/shared/date'
import type { TDataStore } from '../domain/zenmoney/store'
import type { TCoreContext } from '../types'
import {
  getDebtAccountId,
  getHistoryStart,
  getInstCodeMap,
  getTagBudgets,
  getTransactionIds,
  getTransactionsHistory,
  getUserCurrency,
} from '../domain/zenmoney'
import {
  getEnvBudgets,
  getEnvelopeMeta,
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
  }
}

export type TProjectionGraph = ReturnType<typeof createProjectionGraph>
