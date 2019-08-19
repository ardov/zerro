import createSelector from 'selectorator'
import startOfMonth from 'date-fns/start_of_month'
import { getType, getMainTag } from 'store/data/transactions/helpers'
import getMonthDates from './getMonthDates'
import { getTagsTree } from 'store/data/tags'
import { convertCurrency } from 'store/data/instruments'
import { getUserInstrument } from 'store/data/instruments'
import { getBudgetsByMonthAndTag } from 'store/data/budgets'
import { getTransactionsInBudget } from './baseSelectors'
import { round } from 'helpers/currencyHelpers'

export const getTransactionsByMonth = createSelector(
  [getMonthDates, getTransactionsInBudget],
  (monthDates, transactions) => {
    const months = monthDates.reduce((months, date) => {
      months[date] = { date, income: [], outcome: [], transfer: [] }
      return months
    }, {})

    transactions.forEach(tr => {
      const month = +startOfMonth(tr.date)
      const type = getType(tr)
      months[month][type].push(tr)
    })
    return months
  }
)

export const getAmountsByTag = createSelector(
  [getTransactionsByMonth, convertCurrency],
  (transactionsByMonth, convert) =>
    Object.values(transactionsByMonth).map(month => {
      const income = month.income.reduce((byTag, tr) => {
        const tag = getMainTag(tr)
        const amount = convert(tr.income, tr.incomeInstrument)
        byTag[tag] = byTag[tag] ? round(byTag[tag] + amount) : amount
        return byTag
      }, {})
      const outcome = month.outcome.reduce((byTag, tr) => {
        const tag = getMainTag(tr)
        const amount = convert(tr.outcome, tr.outcomeInstrument)
        byTag[tag] = byTag[tag] ? round(byTag[tag] + amount) : amount
        return byTag
      }, {})

      return { date: month.date, income, outcome }
    })
)

export const getAllAmountsByTag = createSelector(
  [getTransactionsByMonth, convertCurrency],
  (transactionsByMonth, convert) =>
    Object.values(transactionsByMonth).map(month => {
      const income = month.income.reduce((byTag, tr) => {
        const tag = getMainTag(tr)
        const amount = convert(tr.income, tr.incomeInstrument)
        byTag[tag] = byTag[tag] ? round(byTag[tag] + amount) : amount
        return byTag
      }, {})
      const outcome = month.outcome.reduce((byTag, tr) => {
        const tag = getMainTag(tr)
        const amount = convert(tr.outcome, tr.outcomeInstrument)
        byTag[tag] = byTag[tag] ? round(byTag[tag] + amount) : amount
        return byTag
      }, {})

      return { date: month.date, income, outcome }
    })
)
