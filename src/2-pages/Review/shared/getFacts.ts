import { createSelector } from '@reduxjs/toolkit'
import { trModel, TrType } from '5-entities/transaction'
import {
  TFxAmount,
  TFxCode,
  TInstrumentId,
  TTagId,
  TTransaction,
} from '6-shared/types'
import { parseDate } from '6-shared/helpers/date'

import { fxRateModel } from '5-entities/currency/fxRate'
import { instrumentModel } from '5-entities/currency/instrument'
import { addFxAmount, convertFx } from '6-shared/helpers/money'
import { accountModel } from '5-entities/account'
import { merchantModel } from '5-entities/merchant'
import { TSelector, useAppSelector } from 'store/index'

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
    trModel.getTransactionsHistory,
    fxRateModel.getter,
    instrumentModel.getInstCodeMap,
    accountModel.getDebtAccountId,
    merchantModel.getMerchants,
  ],
  (transactions, convert, codeMap, debtAcc, merchants) => {
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
      let stats = (result[year] ??= makeStatsNode())
      addToNode(stats.total, tr)

      addToGroup(
        stats.byPayee,
        String((tr.merchant && merchants?.[tr.merchant].title) || tr.payee),
        tr
      )

      const type = trModel.getType(tr, debtAcc)
      if (type === TrType.Income) {
        addToGroup(stats.byCurrency, codeMap[tr.incomeInstrument], tr)
      }
      if (type === TrType.Outcome) {
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
      switch (trModel.getType(tr, debtAcc)) {
        case TrType.Transfer:
          node.transferTransactions.push(tr)
          return

        case TrType.Income:
          node.incomeTransactions.push(tr)
          node.income = addFxAmount(node.income, {
            [codeMap[tr.incomeInstrument]]: tr.income,
          })
          return

        case TrType.Outcome:
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

/** Returns a function to sort transactions ascending by amount */
function compareByAmount(
  toValue: (amount: number, id: TInstrumentId) => number
) {
  return function (tr1: TTransaction, tr2: TTransaction) {
    const amount1 = Math.max(
      toValue(tr1.income, tr1.incomeInstrument),
      toValue(tr1.outcome, tr1.outcomeInstrument)
    )
    const amount2 = Math.max(
      toValue(tr2.income, tr2.incomeInstrument),
      toValue(tr2.outcome, tr2.outcomeInstrument)
    )
    return amount2 - amount1
  }
}
