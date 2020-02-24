import createSelector from 'selectorator'
import { getMainTag } from 'store/localData/transactions/helpers'
import { getTagsTree, getTagLinks } from 'store/localData/tags'
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
      const type = getType(tr)
      const tag = getMainTag(tr)
      const income = convert(tr.income, tr.incomeInstrument)
      const outcome = convert(tr.outcome, tr.outcomeInstrument)

      result[date] = result[date] || {
        income: {}, // amounts by tags
        outcome: {}, // amounts by tags
        transfers: {}, // amounts by accounts
        transferFees: 0,
      }

      switch (type) {
        case 'income':
          result[date].income[tag] = result[date].income[tag]
            ? round(result[date].income[tag] + income)
            : income
          break

        case 'outcome':
          result[date].outcome[tag] = result[date].outcome[tag]
            ? round(result[date].outcome[tag] + outcome)
            : outcome
          break

        case 'transfer':
          // TRANSFER BETWEEN BUDGET ACCOUNTS
          if (
            budgetAccs.includes(tr.incomeAccount) &&
            budgetAccs.includes(tr.outcomeAccount)
          ) {
            result[date].transferFees = round(
              result[date].transferFees + outcome - income
            )
          }
          // TRANSFER TO BUDGET
          else if (budgetAccs.includes(tr.incomeAccount)) {
            result[date].transfers[tr.outcomeAccount] = result[date].transfers[
              tr.outcomeAccount
            ]
              ? round(result[date].transfers[tr.outcomeAccount] - income)
              : -income
          }
          // TRANSFER FROM BUDGET
          else if (budgetAccs.includes(tr.outcomeAccount)) {
            result[date].transfers[tr.incomeAccount] = result[date].transfers[
              tr.incomeAccount
            ]
              ? round(result[date].transfers[tr.incomeAccount] + outcome)
              : outcome
          }
          break

        default:
          break
      }
    })

    return result
  }
)

const getIncomes = createSelector([getAmountsByMonth], amounts => {
  let result = {}
  for (const date in amounts) {
    result[date] = amounts[date].income
  }
  return result
})

const getOutcomes = createSelector([getAmountsByMonth], amounts => {
  let result = {}
  for (const date in amounts) {
    result[date] = amounts[date].outcome
  }
  return result
})

const getTransfers = createSelector([getAmountsByMonth], amounts => {
  let result = {}
  for (const date in amounts) {
    result[date] = amounts[date].transfers
  }
  return result
})

const getLinkedTransfers = createSelector(
  [getTransfers, getAccTagMap],
  (transfers, accTagMap) => {
    let result = {}
    for (const date in transfers) {
      result[date] = {}
      for (const accountId in transfers[date]) {
        // possible problem with deleted tags
        const linkedTag = accTagMap[accountId] || null
        result[date][linkedTag] = round(
          transfers[date][accountId] + (result[date][linkedTag] || 0)
        )
      }
    }
    return result
  }
)

const getTransferFees = createSelector([getAmountsByMonth], amounts => {
  let result = {}
  for (const date in amounts) {
    result[date] = amounts[date].transferFees
  }
  return result
})

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

export const getTagAmounts = (state, month, id) => {
  const amountsByDate = getAmountsByTag(state)
  const dataForDate = amountsByDate.find(data => data.date === month)
  if (!dataForDate) return null

  const { tags } = dataForDate
  for (const parent of tags) {
    if (parent.id === id) return parent
    for (const child of parent.children) {
      if (child.id === id) return child
    }
  }
}

//
//
//
//
//
//
//
//
//

export const getAmountsByTag2 = createSelector(
  [
    getMonthDates,
    getBudgetsByMonthAndTag,
    getTagLinks,
    getIncomes,
    getOutcomes,
    getLinkedTransfers,
  ],
  (dates, budgets, tagLinks, incomes, outcomes, linkedTransfers) => {
    let prevMonth = null
    const result = {}

    for (const date of dates) {
      result[date] = {}
      for (const id in tagLinks) {
        result[date][id] = calcTagGroup({
          id,
          children: tagLinks[id],
          incomes: incomes[date],
          outcomes: outcomes[date],
          budgets: budgets[date],
          linkedTransfers: linkedTransfers[date],
          prevMonth: prevMonth?.[id],
        })
      }
      prevMonth = result[date]
    }

    return result
  }
)

function calcTagGroup({
  id,
  children,

  incomes = {},
  outcomes = {},
  budgets = {},
  linkedTransfers = {},

  prevMonth = {},
}) {
  const subTags = {}
  let childrenBudgeted = 0
  let childrenOutcome = 0
  let childrenIncome = 0
  let childrenAvailable = 0
  let childrenOverspent = 0

  for (const childId of children) {
    subTags[childId] = {
      income: incomes[childId] || 0,
      get outcome() {
        return this.tagOutcome + this.transferOutcome
      },
      tagOutcome: outcomes[childId] || 0,
      transferOutcome: linkedTransfers[childId] || 0,
      budget: budgets[childId]?.outcome || 0,
      prevAvailable:
        (prevMonth.children?.[childId]?.available > 0 &&
          prevMonth.children[childId].available) ||
        0,
      get available() {
        return round(this.prevAvailable + this.budget - this.outcome)
      },
    }

    childrenBudgeted = round(childrenBudgeted + subTags[childId].budget)
    childrenOutcome = round(childrenOutcome + subTags[childId].outcome)
    childrenIncome = round(childrenIncome + subTags[childId].income)
    if (subTags[childId].available > 0)
      childrenAvailable = round(childrenAvailable + subTags[childId].available)
    if (subTags[childId].available < 0)
      childrenOverspent = round(childrenAvailable - subTags[childId].available)
  }

  return {
    // tag budget || sum of children budgets
    get totalBudget() {
      return round(this.budget + childrenBudgeted)
    },

    // sum of all children outcome + parent outcome
    get totalOutcome() {
      return round(this.outcome + childrenOutcome)
    },

    // sum of all children income + parent income
    get totalIncome() {
      return round(this.income + childrenIncome)
    },

    // sum of all children available without overspent + parent available
    get totalAvailable() {
      return round(this.available + childrenAvailable)
    },

    get totalOverspent() {
      return this.available < 0 ? -this.available : 0
    },

    income: incomes[id] || 0,

    tagOutcome: outcomes[id] || 0,
    transferOutcome: linkedTransfers[id] || 0, //null
    get outcome() {
      return this.tagOutcome + this.transferOutcome
    },

    budget: budgets[id]?.outcome || 0,

    prevAvailable: prevMonth.available > 0 ? prevMonth.available : 0,

    get available() {
      const { prevAvailable, budget, outcome } = this
      return round(prevAvailable + budget - outcome - childrenOverspent)
    },

    children: subTags,
  }
}
