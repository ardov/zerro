import { createSelector } from '@reduxjs/toolkit'
import { core } from '@/zerro-core/redux'

import type { TFxAmount, TFxCode, TTagId, TTransaction } from '@/6-shared/types'
import { parseDate } from '@/6-shared/helpers/date'

import { addFxAmount } from '@/6-shared/helpers/money'
import type { TSelector } from '@/store/index'
import { useAppSelector } from '@/store/index'

type TInfoNode = {
  income: TFxAmount
  outcome: TFxAmount
  incomeTransactions: TTransaction[]
  outcomeTransactions: TTransaction[]
  transferTransactions: TTransaction[]
}

export type TStats = {
  total: TInfoNode
  byPayee: Record<string, TInfoNode>
  byCurrency: Record<TFxCode, TInfoNode>
  byTag: Record<TTagId, TInfoNode>
  byMonth: Record<number, TInfoNode>
  byWeekday: Record<number, TInfoNode>
}

export const getFactsYearly: TSelector<Record<string, TStats>> = createSelector(
  [
    core.transactions.selectHistory,
    core.instruments.selectCodeMap,
    core.accounts.selectDebtAccountId,
    core.merchants.selectAll,
  ],
  (transactions, codeMap, debtAcc, merchants) => {
    // const rates = convert('current').rates
    // const toValue = (n: number, instr: TInstrumentId) => {
    //   return convertFx({ [codeMap[instr]]: n }, 'USD', rates)
    // }

    // const transactions = transactions.sort(compareByAmount(toValue))

    const result: Record<string, TStats> = {}
    transactions.forEach(processTransaction)
    return result

    function processTransaction(tr: TTransaction) {
      const year = tr.date.slice(0, 4)
      const stats = (result[year] ??= makeStatsNode())
      addToNode(stats.total, tr)

      addToGroup(
        stats.byPayee,
        String((tr.merchant && merchants?.[tr.merchant].title) || tr.payee),
        tr
      )

      const type = core.transactions.getType(tr, debtAcc)
      if (type === core.transactions.TrType.Income) {
        addToGroup(stats.byCurrency, codeMap[tr.incomeInstrument], tr)
      }
      if (type === core.transactions.TrType.Outcome) {
        addToGroup(stats.byCurrency, codeMap[tr.outcomeInstrument], tr)
      }

      addToGroup(stats.byTag, tr.tag ? tr.tag[0] : 'null', tr)
      addToGroup(stats.byMonth, parseDate(tr.date).getMonth().toString(), tr)
      addToGroup(stats.byWeekday, parseDate(tr.date).getDay().toString(), tr)
    }

    function addToGroup(
      node: Record<string, TInfoNode>,
      key: string,
      tr: TTransaction
    ) {
      node[key] ??= makeInfoNode()
      addToNode(node[key], tr)
    }

    function addToNode(node: TInfoNode, tr: TTransaction) {
      switch (core.transactions.getType(tr, debtAcc)) {
        case core.transactions.TrType.Transfer:
          node.transferTransactions.push(tr)
          return

        case core.transactions.TrType.Income:
          node.incomeTransactions.push(tr)
          node.income = addFxAmount(node.income, {
            [codeMap[tr.incomeInstrument]]: tr.income,
          })
          return

        case core.transactions.TrType.Outcome:
          node.outcomeTransactions.push(tr)
          node.outcome = addFxAmount(node.outcome, {
            [codeMap[tr.outcomeInstrument]]: tr.outcome,
          })
          return
      }
    }
  }
)

export function useStats(year: string | number) {
  const stats = useAppSelector(getFactsYearly)
  return stats[year] || makeStatsNode()
}

/*
 *
 *
 *
 *
 *   H E L P E R S
 *
 *
 *
 *
 */

/** Creates InfoNode */
function makeInfoNode(): TInfoNode {
  return {
    income: {},
    outcome: {},
    incomeTransactions: [],
    outcomeTransactions: [],
    transferTransactions: [],
  }
}

/** Creates Stats node */
function makeStatsNode(): TStats {
  return {
    total: makeInfoNode(),
    byPayee: {},
    byCurrency: {},
    byTag: {},
    byMonth: {},
    byWeekday: {},
  }
}
