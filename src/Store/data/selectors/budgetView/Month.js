import { check } from '../../../filterConditions'
import startOfMonth from 'date-fns/start_of_month'
import endOfMonth from 'date-fns/end_of_month'

export default class Month {
  constructor(
    date,
    {
      prevMonth,
      startFunds = 0, // for first month only
      transactions = [],
      tags,
      budgets,
      accountsInBalance = [],
      userInstrument,
      budgetedInFuture = 0
    }
  ) {
    this.date = startOfMonth(date)
    this.endOfMonth = endOfMonth(date)
    this.prevMonth = prevMonth
    this.prevFunds = prevMonth ? prevMonth.funds : startFunds ? startFunds : 0
    this.prevOverspent = prevMonth ? prevMonth.overspent : 0
    this.prevTags = prevMonth ? prevMonth.tags : null
    this.budgetedInFuture = budgetedInFuture

    this.transactions = transactions.filter(
      check({ dateFrom: this.date, dateTo: this.endOfMonth })
    )

    this.transfers = groupTransfersOutsideBudget(
      this.transactions,
      accountsInBalance,
      userInstrument
    )

    this.tags = calcTagsData(tags, this.transactions, budgets, userInstrument)
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

  // all income this month
  get income() {
    return this.tags.reduce((sum, tag) => sum + tag.totalOutcome, 0)
  }

  // all transfers from accounts outside budget
  get transferIncome() {
    return this.transfers.reduce(
      (sum, account) => sum + account.transferOutcome,
      0
    )
  }

  // all transfers to accounts outside budget
  get transferOutcome() {
    return this.transfers.reduce(
      (sum, account) => sum + account.transferIncome,
      0
    )
  }

  // BUDGETS
  // sum of all budgets for this month
  get budgeted() {
    return this.tags.reduce((sum, tag) => sum + tag.totalBudgeted, 0)
  }

  // Overspent needs for next month (sum of all availibles sub zero)
  get overspent() {
    return this.tags.reduce((sum, tag) => sum + tag.totalOverspent, 0)
  }
}

//
//

function calcTagsData(tags, transactions, budgets, userInstrument) {
  return [
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
  ]
}
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
