import { createSelector } from '@reduxjs/toolkit'
import { getMainTag } from 'store/data/transactions/helpers'
import { getTagLinks } from 'store/data/tags'
import { convertCurrency } from 'store/data/instruments'
import { getBudgetsByMonthAndTag } from 'store/data/budgets'
import { round } from 'shared/helpers/currencyHelpers'
import { getAccTagMap } from 'store/data/hiddenData/accTagMap'
import startOfMonth from 'date-fns/startOfMonth'
import { getType } from 'store/data/transactions/helpers'
import { getMonthDates } from './getMonthDates'
import { getInBudgetAccounts } from 'store/data/accounts'
import { PopulatedBudget, TSelector } from 'types'
import { withPerf } from 'shared/helpers/performance'
import { RootState } from 'store'
import { getTransactionsHistory } from 'store/data/transactions'

interface DateNode {
  income: { [tagId: string]: number }
  outcome: { [tagId: string]: number }
  transfers: { [accId: string]: number }
  transferFees: number
}
const makeDateNode = (): DateNode => ({
  income: {},
  outcome: {},
  transfers: {},
  transferFees: 0,
})

const getAmountsByMonth: TSelector<{
  [month: number]: DateNode
}> = createSelector(
  [getTransactionsHistory, convertCurrency, getInBudgetAccounts],
  (transactions, convert, accountsInBudget) => {
    const result: { [date: number]: DateNode } = {}

    const budgetAccs = accountsInBudget.map(acc => acc.id)
    const inBudget = (accId: string) => budgetAccs.includes(accId)

    transactions.forEach(tr => {
      // Skip transactions outside budget
      if (!inBudget(tr.incomeAccount) && !inBudget(tr.outcomeAccount)) return

      const month = +startOfMonth(tr.date)
      const type = getType(tr)
      const tag = getMainTag(tr) || 'null'
      const income = convert(tr.income, tr.incomeInstrument)
      const outcome = convert(tr.outcome, tr.outcomeInstrument)

      result[month] ??= makeDateNode()
      const node = result[month]

      switch (type) {
        case 'income':
          node.income[tag] ??= 0
          node.income[tag] = round(node.income[tag] + income)
          return

        case 'outcome':
          node.outcome[tag] ??= 0
          node.outcome[tag] = round(node.outcome[tag] + outcome)
          return

        case 'transfer':
          // TRANSFER BETWEEN BUDGET ACCOUNTS
          if (inBudget(tr.incomeAccount) && inBudget(tr.outcomeAccount)) {
            const fee = outcome - income
            node.transferFees = round(node.transferFees + fee)
            return
          }
          // TRANSFER TO BUDGET
          else if (inBudget(tr.incomeAccount)) {
            node.transfers[tr.outcomeAccount] ??= 0
            node.transfers[tr.outcomeAccount] = round(
              node.transfers[tr.outcomeAccount] - income
            )
            return
          }
          // TRANSFER FROM BUDGET
          else if (inBudget(tr.outcomeAccount)) {
            node.transfers[tr.incomeAccount] ??= 0
            node.transfers[tr.incomeAccount] = round(
              node.transfers[tr.incomeAccount] + outcome
            )
            return
          }
          break

        default:
          throw new Error('Unknown transaction type: ' + type)
      }
    })

    return result
  }
)

interface AmountsByDate {
  [date: string]: { [id: string]: number }
}

// Used only for TransferTable
export const getTransfers = createSelector([getAmountsByMonth], amounts => {
  let result: AmountsByDate = {}
  for (const date in amounts) {
    result[date] = amounts[date].transfers
  }
  return result
})

export const getLinkedTransfers = createSelector(
  [getAccTagMap, getAmountsByMonth],
  (accTagMap, amounts) => {
    let result: AmountsByDate = {}
    for (const date in amounts) {
      result[date] = {}
      for (const accountId in amounts[date].transfers) {
        // possible problem with deleted tags
        const linkedTag = accTagMap[accountId] || 'null'
        result[date][linkedTag] = round(
          amounts[date].transfers[accountId] + (result[date][linkedTag] || 0)
        )
      }
    }
    return result
  }
)

interface TransferFeesByDate {
  [date: string]: number
}
export const getTransferFees = createSelector([getAmountsByMonth], amounts => {
  let result: TransferFeesByDate = {}
  for (const date in amounts) {
    result[date] = amounts[date].transferFees
  }
  return result
})

export type TagAmounts = {
  income: number
  outcome: number
  tagOutcome: number
  transferOutcome: number
  budgeted: number
  leftover: number
  available: number
  // Group totals
  totalBudgeted: number
  totalOutcome: number
  totalIncome: number
  totalLeftover: number
  totalAvailable: number
  totalOverspent: number
  // Children totals
  childrenBudgeted: number
  childrenOutcome: number
  childrenIncome: number
  childrenAvailable: number
  childrenOverspent: number
  childrenLeftover: number
  // Children amounts
  children?: { [childId: string]: TagAmounts }
}
export type TagGroupAmounts = TagAmounts

export const getAmountsByTag: (state: RootState) => {
  [month: string]: {
    [tagId: string]: TagGroupAmounts
  }
} = createSelector(
  [
    getMonthDates,
    getBudgetsByMonthAndTag,
    getTagLinks,
    getLinkedTransfers,
    getAmountsByMonth,
  ],
  withPerf(
    'BUDGET: getAmountsByTag',
    (dates, budgets, tagLinks, linkedTransfers, amounts) => {
      const result: {
        [month: string]: {
          [tagId: string]: TagGroupAmounts
        }
      } = {}
      let prevMonth: {
        [tagId: string]: TagGroupAmounts
      } = {}

      for (const date of dates) {
        result[date] = {}
        for (const id in tagLinks) {
          result[date][id] = calcTagGroupAmounts({
            id,
            children: tagLinks[id],
            incomes: amounts[date]?.income,
            outcomes: amounts[date]?.outcome,
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
)

export const getAmountsById = createSelector([getAmountsByTag], amounts => {
  let result: {
    [month: string]: {
      [tagId: string]: TagGroupAmounts | TagAmounts
    }
  } = {}

  for (const month in amounts) {
    result[month] = { ...amounts[month] }
    for (const parent in amounts[month]) {
      const children = amounts[month][parent].children
      for (const child in children) {
        result[month][child] = children[child]
      }
    }
  }
  return result
})

function calcTagGroupAmounts(data: {
  id: string
  children: string[]
  incomes: { [id: string]: number }
  outcomes: { [id: string]: number }
  budgets: { [tagId: string]: PopulatedBudget }
  linkedTransfers: { [id: string]: number }
  prevMonth?: TagGroupAmounts
}): TagGroupAmounts {
  const {
    id,
    children,
    incomes = {},
    outcomes = {},
    budgets = {},
    linkedTransfers = {},
    prevMonth,
  } = data
  const subTags: { [childId: string]: TagAmounts } = {}

  // Children totals
  let childrenBudgeted = 0
  let childrenOutcome = 0
  let childrenIncome = 0
  let childrenAvailable = 0
  let childrenOverspent = 0
  let childrenLeftover = 0

  for (const childId of children) {
    // Child tag amounts
    const budgeted = budgets[childId]?.convertedOutcome || 0
    const income = incomes[childId] || 0
    const tagOutcome = outcomes[childId] || 0
    const transferOutcome = linkedTransfers[childId] || 0
    const outcome = round(tagOutcome + transferOutcome)
    const leftover = clampAvailable(prevMonth?.children?.[childId]?.available)
    const available = round(leftover + budgeted - outcome)

    subTags[childId] = {
      // Main tag amounts
      budgeted,
      income,
      tagOutcome,
      transferOutcome,
      outcome,
      leftover,
      available,
      // Group totals
      totalBudgeted: budgeted,
      totalOutcome: outcome,
      totalIncome: income,
      totalLeftover: leftover,
      totalAvailable: available,
      totalOverspent: available < 0 ? -available : 0,
      // Children totals
      childrenBudgeted: 0,
      childrenOutcome: 0,
      childrenIncome: 0,
      childrenAvailable: 0,
      childrenOverspent: 0,
      childrenLeftover: 0,
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
  const budgeted = budgets[id]?.convertedOutcome || 0
  const income = incomes[id] || 0
  const tagOutcome = outcomes[id] || 0
  let transferOutcome = linkedTransfers[id] || 0 // все переводы идут в null
  if (id === 'null') transferOutcome = 0
  const outcome = round(tagOutcome + transferOutcome)
  const leftover = clampAvailable(prevMonth?.available)
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

const CARRY_NEGATIVES = !!localStorage.getItem('CARRY_NEGATIVES')

function clampAvailable(available = 0) {
  if (CARRY_NEGATIVES) return available
  return available > 0 ? available : 0
}
