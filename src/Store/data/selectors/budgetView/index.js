import createSelector from 'selectorator'
import { getTransactionList } from '../transaction'
import { getBudgetsByMonthAndTag } from '../budgets'
import { getTagsTree } from '../tags'
import { getInBalance } from '../accounts'
import { check } from '../``../../filterConditions'
import startOfMonth from 'date-fns/start_of_month'
import isSameMonth from 'date-fns/is_same_month'
import endOfMonth from 'date-fns/end_of_month'
import { getRootUser } from '../users'

// EXAMPLE

const month = {
  date: 0, // first date of month

  // TO BE BUDGETED
  get toBeBudgeted() {
    const { funds, budgeted, budgetedInFuture } = this
    return funds - budgeted > 0
      ? funds - budgeted - budgetedInFuture > 0
        ? funds - budgeted - budgetedInFuture
        : 0
      : funds - budgeted
  },

  // FUNDS
  get funds() {
    const {
      prevFunds,
      income,
      transferIncome,
      transferOutcome,
      prevOverspent
    } = this

    return prevFunds - prevOverspent + income + transferIncome - transferOutcome
  },

  prevFunds: 0, // leftover from previous month (start balances for first month)
  prevOverspent: 0, // sum of all availible sub zero

  get income() {
    // all income this month
    return this.tags.reduce((sum, tag) => sum + tag.totalOutcome, 0)
  },

  get transferIncome() {
    // all transfers from accounts outside budget
    return this.transfers.reduce(
      (sum, account) => sum + account.transferOutcome,
      0
    )
  },
  get transferOutcome() {
    // all transfers to accounts outside budget
    return this.transfers.reduce(
      (sum, account) => sum + account.transferOutcome,
      0
    )
  },

  // Budgets

  get budgeted() {
    // sum of all budgets for this month
    return this.tags.reduce((sum, tag) => sum + tag.totalBudgeted, 0)
  },
  budgetedInFuture: 0, // sum of all budgeted in future

  get overspent() {
    return this.tags.reduce((sum, tag) => sum + tag.totalOverspent, 0)
  }, // needs for next month (sum of all availibles sub zero)

  // TAGS TREE
  tags: [
    {
      id: 'idididi',
      title: 'tag name',

      // CALCULATED FIELDS
      get totalBudgeted() {
        // tag budget || sum of children budgets
        return this.budgeted
          ? this.budgeted
          : this.children.reduce((sum, child) => sum + child.budgeted, 0)
      },
      get totalOutcome() {
        // sum of all children outcome + parent outcome
        return (
          this.outcome +
          this.children.reduce((sum, child) => sum + child.outcome, 0)
        )
      },
      get totalIncome() {
        // sum of all children income + parent income
        return (
          this.income +
          this.children.reduce((sum, child) => sum + child.income, 0)
        )
      },
      get totalAvailible() {
        // sum of all children availible + parent availible
        return (
          this.availible +
          this.children.reduce((sum, child) => sum + child.availible, 0)
        )
      },
      get totalOverspent() {
        const parentOverspent = this.availible < 0 ? -this.availible : 0
        const childrenOverspent = this.children.reduce(
          (sum, child) => (child.availible < 0 ? sum - child.availible : sum),
          0
        )
        return parentOverspent + childrenOverspent
      },

      budgeted: 0, // parent budget
      outcome: 500, // parent outcome
      income: 0, // parent income
      prevAvailible: 1000, // availible from previous month (>=0)

      get availible() {
        return this.budgeted - this.outcome + this.prevAvailible
      },

      children: [
        {
          id: 'idididi',
          title: 'tag name',

          // CALCULATED FIELDS
          budgeted: 1000, // tag budget
          outcome: 500, // sum of all outcome transactions
          income: 500, // sum of all income transactions
          prevAvailible: 1000, // availible from previous month (>=0)

          get availible() {
            return this.budgeted - this.outcome + this.prevAvailible
          }
        }
      ]
    }
  ],

  // TRANSFERS
  // list of all accounts out of balance
  transfers: [
    {
      // ACCOUNT
      id: 'accountId',
      // ...

      transferIncome: 2000,
      transferOutcome: 2000
    }
  ]
}

export const getAllBudgets = createSelector(
  [
    getTransactionList,
    getBudgetsByMonthAndTag,
    getTagsTree,
    getInBalance,
    getRootUser
  ],
  (transactions, budgets, tags, accountsInBalance, rootUser) => {
    const userInstrument = rootUser.currency
    const filteredTr = transactions.filter(
      check({
        deleted: false,
        accounts: accountsInBalance.map(acc => acc.id)
      })
    )

    const firstMonth = startOfMonth(filteredTr[filteredTr.length - 1].date)
    const lastMonth = getLastMonth(budgets)
    const months = generateMonths(firstMonth, lastMonth)

    const transfers = groupTransfersOutsideBudget(
      filteredTr,
      accountsInBalance,
      userInstrument
    )
    return {
      month,
      months,
      transfers,
      allTr: transactions,
      filteredTr: filteredTr
    }
  }
)

function getLastMonth(budgets) {
  const lastBudget = new Date(
    Object.keys(budgets)
      .map(s => parseInt(s))
      .sort((a, b) => b - a)
      .pop()
  )
  const thisMonth = startOfMonth(Date.now())

  return lastBudget > thisMonth ? lastBudget : thisMonth
}

function generateMonths(first, last) {
  const initialMonth = {
    date: 0,
    toBeBudgeted: 0,
    currFunds: 0,
    budgeted: 0,
    budgetedInFuture: 0,
    overspent: 0,
    categories: [],
    transfers: []
  }
  const result = []

  if (isSameMonth(first, last)) return [{ ...initialMonth, date: +first }]

  let cur = first
  while (!isSameMonth(cur, last)) {
    result.push({ ...initialMonth, date: +cur })
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1)
  }
  return result
}

// HELPERS
function groupTransfersOutsideBudget(
  transactions,
  accountsInBalance,
  userInstrument
) {
  const accountIds = accountsInBalance.map(acc => acc.id)
  const transfers = transactions.filter(check({ type: 'transfer' }))

  const outcomeTransfers = transfers.filter(
    tr => !accountIds.includes(tr.incomeAccount.id)
  )
  const incomeTransfers = transfers.filter(
    tr => !accountIds.includes(tr.outcomeAccount.id)
  )

  const accsById = {}

  outcomeTransfers.forEach(tr => {
    const accId = tr.incomeAccount.id
    if (!accsById[accId]) {
      accsById[accId] = {
        ...tr.incomeAccount,
        transferIncome: 0,
        transferOutcome: 0
      }
    }
    accsById[accId].transferIncome +=
      (tr.outcome * tr.outcomeInstrument.rate) / userInstrument.rate
  })

  incomeTransfers.forEach(tr => {
    const accId = tr.outcomeAccount.id
    if (!accsById[accId]) {
      accsById[accId] = {
        ...tr.outcomeAccount,
        transferIncome: 0,
        transferOutcome: 0
      }
    }
    accsById[accId].transferOutcome +=
      (tr.income * tr.incomeInstrument.rate) / userInstrument.rate
  })

  return Object.keys(accsById).map(id => accsById[id])
}
