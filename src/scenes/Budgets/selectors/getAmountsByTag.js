import createSelector from 'selectorator'
import startOfMonth from 'date-fns/start_of_month'
import { getType, getMainTag } from 'store/data/transactions/helpers'
import getMonthDates from './getMonthDates'
import { getTagsTree } from 'store/data/tags'
import { convertCurrency } from 'store/data/instruments'
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

export const getIncomeOutcomeByTag = createSelector(
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

export const getAmountsByTag = createSelector(
  [getIncomeOutcomeByTag, getBudgetsByMonthAndTag, getTagsTree],
  (months, budgets, tags) => {
    let prevMonth = null
    return months.map(month => {
      const result = tags.map((parent, pIndex) => ({
        // Tag data
        ...parent,

        // From previous selector
        outcome: month.outcome[parent.id] || 0,
        income: month.income[parent.id] || 0,

        // From budgets
        budgeted:
          (budgets[month.date] &&
            budgets[month.date][parent.id] &&
            budgets[month.date][parent.id].outcome) ||
          0,
        prevAvailable:
          (prevMonth &&
            prevMonth[pIndex].available > 0 &&
            prevMonth[pIndex].available) ||
          0,
        get available() {
          const { prevAvailable, budgeted, outcome, children } = this
          const childrenOverspent = children.reduce(
            (sum, child) =>
              child.available < 0 ? round(sum - child.available) : sum,
            0
          )
          return round(prevAvailable + budgeted - outcome - childrenOverspent)
        },

        // tag budget || sum of children budgets
        get totalBudgeted() {
          return round(
            this.budgeted +
              this.children.reduce((sum, child) => sum + child.budgeted, 0)
          )
        },

        // sum of all children outcome + parent outcome
        get totalOutcome() {
          return round(
            this.outcome +
              this.children.reduce((sum, child) => sum + child.outcome, 0)
          )
        },

        // sum of all children income + parent income
        get totalIncome() {
          return round(
            this.income +
              this.children.reduce((sum, child) => sum + child.income, 0)
          )
        },

        // sum of all children available without overspent + parent available
        get totalAvailable() {
          return round(
            this.available +
              this.children.reduce((sum, child) => {
                return child.available > 0 ? sum + child.available : sum
              }, 0)
          )
        },

        get totalOverspent() {
          return this.available < 0 ? -this.available : 0
        },

        // Children
        children: parent.children.map((child, i) => ({
          ...child,
          outcome: month.outcome[child.id] || 0,
          income: month.income[child.id] || 0,
          budgeted:
            (budgets[month.date] &&
              budgets[month.date][child.id] &&
              budgets[month.date][child.id].outcome) ||
            0,
          prevAvailable:
            (prevMonth &&
              prevMonth[pIndex].children[i].available > 0 &&
              prevMonth[pIndex].children[i].available) ||
            0,
          get available() {
            return round(this.prevAvailable + this.budgeted - this.outcome)
          },
        })),
      }))
      prevMonth = result
      return result
    })
  }
)
