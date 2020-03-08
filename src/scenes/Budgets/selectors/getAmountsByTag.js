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
    getBudgetsByMonthAndTag,
    getTagsTree,
    getLinkedTransfers,
    getIncomes,
    getOutcomes,
    getTransfers,
    getTransferFees,
  ],
  (
    dates,
    budgets,
    tagsTree,
    linkedTransfers,
    incomes,
    outcomes,
    transfersByDate,
    transferFees
  ) => {
    let prevMonth = null

    return dates.map(date => {
      const connectedTransfers = linkedTransfers[date] || {}
      const income = incomes[date] || {}
      const outcome = outcomes[date] || {}

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
        transferOutcome: (parent.id && connectedTransfers[parent.id]) || 0,

        // From budgets
        budgeted:
          (budgets[date] &&
            budgets[date][parent.id] &&
            budgets[date][parent.id].outcome) ||
          0,
        leftover:
          (prevMonth &&
            prevMonth[pIndex].available > 0 &&
            prevMonth[pIndex].available) ||
          0,
        get available() {
          const { leftover, budgeted, outcome, children } = this
          const childrenOverspent = children.reduce(
            (sum, child) =>
              child.available < 0 ? round(sum - child.available) : sum,
            0
          )
          return round(leftover + budgeted - outcome - childrenOverspent)
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
          leftover:
            (prevMonth &&
              prevMonth[pIndex].children[i].available > 0 &&
              prevMonth[pIndex].children[i].available) ||
            0,
          get available() {
            return round(this.leftover + this.budgeted - this.outcome)
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
        transferFees: transferFees[date] || 0,
        transferOutcome: connectedTransfers.null || 0,
        transfers: transfersByDate[date] || {},
      }
    })
  }
)

//
//
//
//
//
//
//
//
//
// TODO: start using this function it's 2-4x faster
export const getAmountsForTag = state => (month, id) => {
  const amounts = getAmountsByTag2(state)[month]
  if (amounts[id]) return amounts[id]
  else {
    for (const parent in amounts) {
      if (amounts[parent].children[id]) return amounts[parent].children[id]
    }
  }
  return null
}

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
        result[date][id] = calcTagGroupAmounts({
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

function calcTagGroupAmounts({
  id,
  children,
  incomes = {},
  outcomes = {},
  budgets = {},
  linkedTransfers = {},
  prevMonth = {},
}) {
  const subTags = {}

  // Children totals
  let childrenBudgeted = 0
  let childrenOutcome = 0
  let childrenIncome = 0
  let childrenAvailable = 0
  let childrenOverspent = 0

  for (const childId of children) {
    // Child tag amounts
    const budgeted = budgets[childId]?.outcome || 0
    const income = incomes[childId] || 0
    const tagOutcome = outcomes[childId] || 0
    const transferOutcome = linkedTransfers[id] || 0
    const outcome = round(tagOutcome + transferOutcome)
    const leftover =
      (prevMonth.children?.[childId]?.available > 0 &&
        prevMonth.children[childId].available) ||
      0
    const available = round(leftover + budgeted - outcome)

    subTags[childId] = {
      income,
      outcome,
      tagOutcome,
      transferOutcome,
      budgeted,
      leftover,
      available,
    }

    // Update children totals
    childrenBudgeted = round(childrenBudgeted + budgeted)
    childrenOutcome = round(childrenOutcome + outcome)
    childrenIncome = round(childrenIncome + income)
    if (available > 0) childrenAvailable = round(childrenAvailable + available)
    if (available < 0) childrenOverspent = round(childrenAvailable - available)
  }

  // Main tag amounts
  const budgeted = budgets[id]?.outcome || 0
  const income = incomes[id] || 0
  const tagOutcome = outcomes[id] || 0
  const transferOutcome = linkedTransfers[id] || 0 // все переводы идут в null
  const outcome = round(tagOutcome + transferOutcome)
  const leftover = prevMonth.available > 0 ? prevMonth.available : 0
  const available = round(leftover + budgeted - outcome - childrenOverspent)

  return {
    // Group totals
    totalBudgeted: round(budgeted + childrenBudgeted),
    totalOutcome: round(outcome + childrenOutcome),
    totalIncome: round(income + childrenIncome),
    totalAvailable: round(available + childrenAvailable),
    totalOverspent: available < 0 ? -available : 0,

    // Main tag amounts
    budgeted,
    income,
    tagOutcome,
    transferOutcome,
    outcome,
    leftover,
    available,

    // Children totals
    childrenBudgeted,
    childrenOutcome,
    childrenIncome,
    childrenAvailable,
    childrenOverspent,

    children: subTags,
  }
}
