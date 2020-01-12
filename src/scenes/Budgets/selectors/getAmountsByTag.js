import createSelector from 'selectorator'
import { getMainTag } from 'store/localData/transactions/helpers'
import { getTagsTree } from 'store/localData/tags'
import { convertCurrency } from 'store/serverData'
import { getBudgetsByMonthAndTag } from 'store/localData/budgets'
import { round } from 'helpers/currencyHelpers'
import { getAccTagMap } from 'store/localData/hiddenData'

import startOfMonth from 'date-fns/startOfMonth'
import { getType } from 'store/localData/transactions/helpers'
import getMonthDates from './getMonthDates'
import { getTransactionsInBudget } from './baseSelectors'
import { getAccountsInBudget } from 'store/localData/accounts'

const getAmountsByMonth = createSelector(
  [getTransactionsInBudget, convertCurrency, getAccountsInBudget],
  (transactions, convert, accountsInBudget) => {
    const budgetAccs = accountsInBudget.map(acc => acc.id)
    const result = {}

    transactions.forEach(tr => {
      const date = +startOfMonth(tr.date)
      if (!result[date]) {
        result[date] = {
          income: {}, // amounts by tags
          outcome: {}, // amounts by tags
          transfers: {}, // amounts by accounts
          transferFees: 0,
        }
      }
      result[date].date = new Date(date).toLocaleString()

      const type = getType(tr)
      const tag = getMainTag(tr)

      // INCOME
      if (type === 'income') {
        const amount = convert(tr.income, tr.incomeInstrument)
        result[date].income[tag] = result[date].income[tag]
          ? round(result[date].income[tag] + amount)
          : amount
      }
      // OUTCOME
      else if (type === 'outcome') {
        const amount = convert(tr.outcome, tr.outcomeInstrument)
        result[date].outcome[tag] = result[date].outcome[tag]
          ? round(result[date].outcome[tag] + amount)
          : amount
      }
      // TRANSFER BETWEEN BUDGET ACCOUNTS
      else if (
        type === 'transfer' &&
        budgetAccs.includes(tr.incomeAccount) &&
        budgetAccs.includes(tr.outcomeAccount)
      ) {
        result[date].transferFees = round(
          result[date].transferFees +
            convert(tr.outcome, tr.outcomeInstrument) -
            convert(tr.income, tr.incomeInstrument)
        )
      }
      // TRANSFER TO BUDGET
      else if (type === 'transfer' && budgetAccs.includes(tr.incomeAccount)) {
        result[date].transfers[tr.outcomeAccount] = result[date].transfers[
          tr.outcomeAccount
        ]
          ? round(
              result[date].transfers[tr.outcomeAccount] -
                convert(tr.income, tr.incomeInstrument)
            )
          : -convert(tr.income, tr.incomeInstrument)
      }
      // TRANSFER FROM BUDGET
      else if (type === 'transfer' && budgetAccs.includes(tr.outcomeAccount)) {
        result[date].transfers[tr.incomeAccount] = result[date].transfers[
          tr.incomeAccount
        ]
          ? round(
              result[date].transfers[tr.incomeAccount] +
                convert(tr.outcome, tr.outcomeInstrument)
            )
          : convert(tr.outcome, tr.outcomeInstrument)
      }
    })

    return result
  }
)

export const getAmountsByTag = createSelector(
  [
    getMonthDates,
    getAmountsByMonth,
    getBudgetsByMonthAndTag,
    getTagsTree,
    getAccTagMap,
  ],
  (dates, amounts, budgets, tagsTree, accTagMap) => {
    let prevMonth = null

    return dates.map(date => {
      const { income = {}, outcome = {}, transfers = {}, transferFees = 0 } =
        amounts[date] || {}

      let transfersAmount = 0
      let connectedTransfers = {}
      for (const accId in transfers) {
        if (accTagMap[accId]) {
          const tagId = accTagMap[accId]
          connectedTransfers[tagId] = round(
            transfers[accId] + (connectedTransfers[tagId] || 0)
          )
        } else {
          // possible problem with deleted tags
          transfersAmount = round(transfersAmount + transfers[accId])
        }
      }

      // TAGS COMPUTATIONS
      const tags = tagsTree.map((parent, pIndex) => ({
        // Tag data
        ...parent,

        // From getIncomeOutcomeByTag selector
        income: income[parent.id] || 0,
        get outcome() {
          return this.tagOutcome + this.transferOutcome
        },
        tagOutcome: outcome[parent.id] || 0,
        transferOutcome: connectedTransfers[parent.id] || 0,

        // From budgets
        budgeted:
          (budgets[date] &&
            budgets[date][parent.id] &&
            budgets[date][parent.id].outcome) ||
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
          income: income[child.id] || 0,
          get outcome() {
            return this.tagOutcome + this.transferOutcome
          },
          tagOutcome: outcome[child.id] || 0,
          transferOutcome: connectedTransfers[child.id] || 0,
          budgeted:
            (budgets[date] &&
              budgets[date][child.id] &&
              budgets[date][child.id].outcome) ||
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
      prevMonth = tags

      //
      //
      //
      return {
        date,
        tags,
        transferFees,
        transferOutcome: transfersAmount,
        transfers,
      }
    })
  }
)
