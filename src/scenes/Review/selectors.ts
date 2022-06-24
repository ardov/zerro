import { createSelector } from '@reduxjs/toolkit'
import { round } from 'shared/helpers/currencyHelpers'
import { getType } from 'store/data/transactions/helpers'
import { getAccounts, getStartBalance } from 'store/data/accounts'
import { getSortedTransactions } from 'store/data/transactions'
import { getTransactionsHistory } from 'store/data/transactions'
import { eachDayOfInterval, startOfDay } from 'date-fns'
import { convertCurrency } from 'store/data/instruments'
import { TRawTransaction, TRawAccount, TAccountId, TInstrumentId } from 'types'

interface DayNode {
  date: number
  balance: number
  transactions: number[]
}
interface History {
  [id: string]: DayNode[]
}

export const getAccountsHistory = createSelector(
  [getTransactionsHistory, getAccounts],
  (transactions: TRawTransaction[], accounts: { [x: string]: TRawAccount }) => {
    if (!transactions?.length || !accounts) return {}
    let historyById = {} as History
    const firstDate = +new Date(transactions[0].date)
    const currentDate = startOfDay(new Date())
    const dateArray = eachDayOfInterval({ start: firstDate, end: currentDate })

    for (const id in accounts) {
      historyById[id] = [
        {
          date: firstDate,
          balance: getStartBalance(accounts[id]),
          transactions: [],
        },
      ]
    }

    const addAmount = (amount: number, acc: TAccountId, date: number) => {
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

    let result = {} as History
    for (const id in historyById) {
      let lastValue = 0
      const dateMap = {} as { [x: number]: DayNode }
      historyById[id].forEach(obj => {
        dateMap[obj.date] = obj
      })

      result[id] = dateArray.map(date => {
        const change = dateMap[+date]
        if (change) {
          lastValue = change.balance
          return change
        }
        return {
          date: +date,
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
  incomeTransactions: TRawTransaction[]
  outcomeTransactions: TRawTransaction[]
  transferTransactions: TRawTransaction[]
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
    [getSortedTransactions, convertCurrency],
    (allTransactions: TRawTransaction[], convert) => {
      if (!allTransactions?.length) return null
      const dateStart = +new Date(year, 0, 1)
      const dateEnd = +new Date(year + 1, 0, 1)
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

      function addToNode(node: InfoNode, tr: TRawTransaction) {
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
        field: keyof TRawTransaction | Function,
        object: any,
        tr: TRawTransaction
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

function getMainTag(tr: TRawTransaction) {
  return tr.tag?.[0] || 'null'
}
function getMonth(tr: TRawTransaction) {
  return new Date(tr.date).getMonth()
}
function getWeekday(tr: TRawTransaction) {
  return new Date(tr.date).getDay()
}

function compareByAmount(
  convert: (amount: number, id: TInstrumentId) => number
) {
  return function (tr1: TRawTransaction, tr2: TRawTransaction) {
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
