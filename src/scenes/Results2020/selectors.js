import createSelector from 'selectorator'
import { round } from 'helpers/currencyHelpers'
import { getType } from 'store/localData/transactions/helpers'
import { getAccounts } from 'store/localData/accounts'
import { getSortedTransactions } from 'store/localData/transactions'
import { getStartBalance } from 'store/localData/accounts/helpers'
import { eachDayOfInterval, startOfDay } from 'date-fns'
import { convertCurrency } from 'store/serverData'

export const getTransactionsHistory = createSelector(
  [getSortedTransactions],
  transactions => transactions.filter(tr => !tr.deleted).reverse()
)

export const getAccountsHistory = createSelector(
  [getTransactionsHistory, getAccounts],
  (transactions, accounts) => {
    if (!transactions?.length || !accounts) return {}
    const changes = {}
    const firstDate = new Date(transactions[0].date)
    const currentDate = startOfDay(new Date())
    const dateArray = eachDayOfInterval({ start: firstDate, end: currentDate })

    for (const id in accounts) {
      changes[id] = [
        {
          date: firstDate,
          balance: getStartBalance(accounts[id]),
          transactions: [],
        },
      ]
    }

    const addAmount = (amount, acc, date) => {
      const accHistory = changes[acc]
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

    let result = {}
    for (const id in changes) {
      let lastValue = 0
      const dateMap = {}
      changes[id].forEach(obj => {
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

const dateStart = new Date(2020, 0, 1)
const dateEnd = new Date(2021, 0, 1)

export const getYearStats = createSelector(
  [getSortedTransactions, getAccounts, convertCurrency],
  (allTransactions, accounts, convert) => {
    if (!allTransactions?.length || !accounts) return null

    const transactions = allTransactions.filter(
      tr => !tr.deleted && tr.date >= dateStart && tr.date < dateEnd
    )
    const { income, outcome, transfer } = splitByType(transactions)
    const byAmount = {
      all: transactions.sort(compareByAmount(convert)),
      income: income.sort(compareByAmount(convert)),
      outcome: outcome.sort(compareByAmount(convert)),
      transfer: transfer.sort(compareByAmount(convert)),
    }

    return { byAmount }
  }
)

function splitByType(transactions) {
  const result = { income: [], outcome: [], transfer: [] }
  transactions.forEach(tr => result[getType(tr)].push(tr))
  return result
}

function compareByAmount(convert) {
  return function (tr1, tr2) {
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
