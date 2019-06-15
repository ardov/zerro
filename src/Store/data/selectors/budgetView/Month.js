import { check } from '../``../../filterConditions'
import startOfMonth from 'date-fns/start_of_month'
import isSameMonth from 'date-fns/is_same_month'
import endOfMonth from 'date-fns/end_of_month'

export default class Month {
  constructor(
    date,
    {
      transactions = [],
      tags,
      accountsInBalance = [],
      userInstrument,
      prevFunds = 0, // leftover from previous month (start balances for first month)
      prevOverspent = 0, // sum of all availible sub zero
      budgetedInFuture = 0
    }
  ) {
    this.transactions = transactions.filter(check({}))
    this.date = date
    this.endOfMonth = endOfMonth(date)
    this.prevFunds = prevFunds
    this.prevOverspent = prevOverspent
    this.budgetedInFuture = budgetedInFuture
    this.transfers = groupTransfersOutsideBudget()
  }

  get toBeBudgeted() {
    const { funds, budgeted, budgetedInFuture } = this
    return funds - budgeted > 0
      ? funds - budgeted - budgetedInFuture > 0
        ? funds - budgeted - budgetedInFuture
        : 0
      : funds - budgeted
  }
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
  }
  get income() {
    // all income this month
    return this.tags.reduce((sum, tag) => sum + tag.totalOutcome, 0)
  }
  get transferIncome() {
    // all transfers from accounts outside budget
    return this.transfers.reduce(
      (sum, account) => sum + account.transferOutcome,
      0
    )
  }
  get transferOutcome() {
    // all transfers to accounts outside budget
    return this.transfers.reduce(
      (sum, account) => sum + account.transferOutcome,
      0
    )
  }
  // Budgets
  get budgeted() {
    // sum of all budgets for this month
    return this.tags.reduce((sum, tag) => sum + tag.totalBudgeted, 0)
  }
  budgetedInFuture: 0 // sum of all budgeted in future
  get overspent() {
    return this.tags.reduce((sum, tag) => sum + tag.totalOverspent, 0)
  } // needs for next month (sum of all availibles sub zero)
}

//
//
//
//
//
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
