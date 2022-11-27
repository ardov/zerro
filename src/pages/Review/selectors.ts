import { createSelector } from '@reduxjs/toolkit'
import { round } from '@shared/helpers/money'
import { getType } from '@entities/transaction/helpers'
import { accountModel } from '@entities/account'
import { getSortedTransactions } from '@entities/transaction'
import { getTransactionsHistory } from '@entities/transaction'
import {
  TAccountId,
  TInstrumentId,
  TISODate,
  TTransaction,
} from '@shared/types'
import { eachDayOfInterval, parseDate, toISODate } from '@shared/helpers/date'
import { displayCurrency } from '@entities/currency/displayCurrency'

interface DayNode {
  date: TISODate
  balance: number
  transactions: number[]
}
interface History {
  [id: TAccountId]: DayNode[]
}

export const getAccountsHistory = createSelector(
  [getTransactionsHistory, accountModel.getPopulatedAccounts],
  (transactions, accounts) => {
    if (!transactions?.length || !accounts) return {}
    let historyById: History = {}
    const firstDate = transactions[0].date
    const dateArray = eachDayOfInterval(firstDate, new Date()).map(toISODate)

    for (const id in accounts) {
      historyById[id] = [
        {
          date: firstDate,
          balance: accounts[id].startBalanceReal,
          transactions: [],
        },
      ]
    }

    const addAmount = (amount: number, acc: TAccountId, date: TISODate) => {
      const accHistory = historyById[acc]
      const lastPoint = accHistory[accHistory.length - 1]
      if (lastPoint.date === date) {
        lastPoint.balance = round(lastPoint.balance + amount)
        lastPoint.transactions.push(amount)
      } else {
        accHistory.push({
          date,
          balance: round(lastPoint.balance + amount),
          transactions: [amount],
        })
      }
    }

    transactions.forEach(tr => {
      const { incomeAccount, outcomeAccount, income, outcome, date } = tr
      const type = getType(tr)

      switch (type) {
        case 'income':
          addAmount(income, incomeAccount, date)
          break

        case 'outcome':
          addAmount(-outcome, outcomeAccount, date)
          break

        case 'transfer':
          addAmount(income, incomeAccount, date)
          addAmount(-outcome, outcomeAccount, date)
          break

        default:
          throw new Error('unsupported type ' + type)
      }
    })

    let result: History = {}
    for (const id in historyById) {
      let lastValue = 0
      const dateMap: Record<TISODate, DayNode> = {}
      historyById[id].forEach(obj => {
        dateMap[obj.date] = obj
      })

      result[id] = dateArray.map(date => {
        const change = dateMap[date]
        if (change) {
          lastValue = change.balance
          return change
        }
        return {
          date,
          balance: lastValue,
          transactions: [],
        }
      })
    }

    return result
  }
)

/**
 *
 *
 *
 *
 *
 *
 *
 */

interface InfoNode {
  income: number
  outcome: number
  incomeTransactions: TTransaction[]
  outcomeTransactions: TTransaction[]
  transferTransactions: TTransaction[]
}

export interface Stats {
  total: InfoNode
  receipts: number
  withGeo: number
  byPayee: { [payee: string]: InfoNode }
  byMerchant: { [merchantId: string]: InfoNode }
  byBankID: { [companyId: number]: InfoNode }
  byInstrument: { [instrumentId: number]: InfoNode }
  byTag: { [tagId: string]: InfoNode }
  byMonth: { [date: number]: InfoNode }
  byWeekday: { [date: number]: InfoNode }
}

const createInfoNode = (): InfoNode => ({
  income: 0,
  outcome: 0,
  incomeTransactions: [],
  outcomeTransactions: [],
  transferTransactions: [],
})

export const getYearStats = (year: number) =>
  createSelector(
    [getSortedTransactions, displayCurrency.convertCurrency],
    (allTransactions: TTransaction[], convert) => {
      if (!allTransactions?.length) return null
      const dateStart = toISODate(new Date(year, 0, 1))
      const dateEnd = toISODate(new Date(year + 1, 0, 1))
      const transactions = allTransactions
        .filter(tr => !tr.deleted && tr.date >= dateStart && tr.date < dateEnd)
        .sort(compareByAmount(convert))
      if (!transactions?.length) return null
      let receipts = {} as any

      let stats = {
        total: createInfoNode(),
        receipts: 0,
        withGeo: 0,
        byPayee: {},
        byMerchant: {},
        byInstrument: {},
        byTag: {},
        byMonth: {},
        byWeekday: {},
      } as Stats

      function addToNode(node: InfoNode, tr: TTransaction) {
        const type = getType(tr)
        if (type === 'transfer') {
          node.transferTransactions.push(tr)
        }
        if (type === 'income') {
          node.income += convert(tr.income, tr.incomeInstrument)
          node.incomeTransactions.push(tr)
        }
        if (type === 'outcome') {
          node.outcome += convert(tr.outcome, tr.outcomeInstrument)
          node.outcomeTransactions.push(tr)
        }
      }

      function groupBy(
        field: keyof TTransaction | Function,
        object: any,
        tr: TTransaction
      ) {
        let key
        if (typeof field === 'string') key = tr[field]
        if (typeof field === 'function') key = field(tr)
        if ((typeof key === 'string' || typeof key === 'number') && key) {
          if (!object[key]) object[key] = createInfoNode()
          addToNode(object[key], tr)
        }
      }

      transactions.forEach(tr => {
        addToNode(stats.total, tr)
        if (tr.qrCode) receipts[tr.qrCode] = true
        if (tr.latitude) stats.withGeo++
        groupBy('payee', stats.byPayee, tr)
        groupBy('merchant', stats.byMerchant, tr)
        groupBy('incomeInstrument', stats.byInstrument, tr)
        groupBy('outcomeInstrument', stats.byInstrument, tr)
        groupBy(getMainTag, stats.byTag, tr)
        groupBy(getMonth, stats.byMonth, tr)
        groupBy(getWeekday, stats.byWeekday, tr)
      })

      stats.receipts = Object.keys(receipts).length
      return stats
    }
  )

function getMainTag(tr: TTransaction) {
  return tr.tag?.[0] || 'null'
}
function getMonth(tr: TTransaction) {
  return parseDate(tr.date).getMonth()
}
function getWeekday(tr: TTransaction) {
  return parseDate(tr.date).getDay()
}

function compareByAmount(
  convert: (amount: number, id: TInstrumentId) => number
) {
  return function (tr1: TTransaction, tr2: TTransaction) {
    const amount1 = Math.max(
      convert(tr1.income, tr1.incomeInstrument),
      convert(tr1.outcome, tr1.outcomeInstrument)
    )
    const amount2 = Math.max(
      convert(tr2.income, tr2.incomeInstrument),
      convert(tr2.outcome, tr2.outcomeInstrument)
    )
    return amount2 - amount1
  }
}
