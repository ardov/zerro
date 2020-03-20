import createSelector from 'selectorator'
import { getMainTag } from 'store/localData/transactions/helpers'
import { getTagLinks } from 'store/localData/tags'
import { convertCurrency } from 'store/serverData'
import { getBudgetsByMonthAndTag } from 'store/localData/budgets'
import { round } from 'helpers/currencyHelpers'
import { getAccTagMap } from 'store/localData/hiddenData'
import * as Sentry from '@sentry/browser'

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

export const getTransfers = createSelector([getAmountsByMonth], amounts => {
  let result = {}
  for (const date in amounts) {
    result[date] = amounts[date].transfers
  }
  return result
})

export const getLinkedTransfers = createSelector(
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

export const getTransferFees = createSelector([getAmountsByMonth], amounts => {
  let result = {}
  for (const date in amounts) {
    result[date] = amounts[date].transferFees
  }
  return result
})

export const getAmountsForTag = state => (month, id) => {
  const amounts = getAmountsByTag(state)[month]

  if (!amounts) {
    if (process.env.NODE_ENV === 'production') {
      Sentry.withScope(scope => {
        const error = new Error(`No amounts found for month:"${month}"`)
        const eventId = Sentry.captureException(error)
        this.setState({ eventId })
      })
    }
    return null
  }

  if (amounts[id]) return amounts[id]
  else {
    for (const parent in amounts) {
      if (amounts[parent].children[id]) return amounts[parent].children[id]
    }
  }
  return null
}

export const getAmountsByTag = createSelector(
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
  let childrenLeftover = 0

  for (const childId of children) {
    // Child tag amounts
    const budgeted = budgets[childId]?.outcome || 0
    const income = incomes[childId] || 0
    const tagOutcome = outcomes[childId] || 0
    const transferOutcome = linkedTransfers[childId] || 0
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
    childrenLeftover = round(childrenLeftover + leftover)
    if (available > 0) childrenAvailable = round(childrenAvailable + available)
    if (available < 0) childrenOverspent = round(childrenOverspent - available)
  }

  // Main tag amounts
  const budgeted = budgets[id]?.outcome || 0
  const income = incomes[id] || 0
  const tagOutcome = outcomes[id] || 0
  let transferOutcome = linkedTransfers[id] || 0 // все переводы идут в null
  if (id === 'null') transferOutcome = 0
  const outcome = round(tagOutcome + transferOutcome)
  const leftover = prevMonth.available > 0 ? prevMonth.available : 0
  const available = round(leftover + budgeted - outcome - childrenOverspent)

  return {
    // Group totals
    totalBudgeted: round(budgeted + childrenBudgeted),
    totalOutcome: round(outcome + childrenOutcome),
    totalIncome: round(income + childrenIncome),
    totalLeftover: round(leftover + childrenLeftover),
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
    childrenLeftover,

    children: subTags,
  }
}
