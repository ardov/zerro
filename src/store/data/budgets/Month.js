import { check } from 'store/filterConditions'
import startOfMonth from 'date-fns/start_of_month'
import endOfMonth from 'date-fns/end_of_month'
import { calcMetrics } from 'store/data/transactions/helpers'

export default class Month {
  constructor(
    date,
    {
      prevMonth,
      startFunds = 0, // for first month only
      transactions = [],
      tags,
      budgets,
      accountsInBudget = [],
      userInstrument,
      realBudgetedInFuture = 0,
    }
  ) {
    this.date = startOfMonth(date)
    this.prevMonth = prevMonth
    this.prevFunds = prevMonth ? prevMonth.funds : startFunds ? startFunds : 0
    this.prevOverspent = prevMonth ? prevMonth.overspent : 0
    this.prevOutcome = prevMonth ? prevMonth.outcome : 0
    this.prevTags = prevMonth ? prevMonth.tags : null
    this.realBudgetedInFuture = realBudgetedInFuture

    this.budgets = budgets

    this.transactions = transactions.filter(
      check({ dateFrom: this.date, dateTo: endOfMonth(this.date) })
    )

    this.transfers = groupTransfersOutsideBudget(
      this.transactions,
      accountsInBudget,
      userInstrument
    )

    this.transferFees = calcTransferFees(
      this.transactions,
      accountsInBudget,
      userInstrument
    )

    this.tags = calcTagsData(
      tags,
      this.prevTags,
      this.transactions,
      this.budgets,
      userInstrument
    )
  }

  get toBeBudgeted() {
    return this.funds - this.budgetedInFuture
  }

  // cannot be negative or greater than funds
  get budgetedInFuture() {
    const { funds, realBudgetedInFuture } = this
    if (realBudgetedInFuture <= 0 || funds <= 0) return 0
    return realBudgetedInFuture > funds ? funds : realBudgetedInFuture
  }

  // FUNDS
  get funds() {
    return round(
      this.prevFunds -
        this.prevOverspent -
        this.budgeted +
        this.income +
        this.transferIncome -
        this.transferOutcome -
        this.transferFees
    )
  }

  // all income this month
  get income() {
    return this.tags.reduce((sum, tag) => round(sum + tag.totalIncome), 0)
  }

  get outcome() {
    return this.tags.reduce((sum, tag) => round(sum + tag.totalOutcome), 0)
  }

  get availible() {
    return this.tags.reduce((sum, tag) => {
      return tag.totalAvailible > 0 ? round(sum + tag.totalAvailible) : sum
    }, 0)
  }

  // all transfers from accounts outside budget
  get transferIncome() {
    return this.transfers.reduce(
      (sum, account) => round(sum + account.transferOutcome),
      0
    )
  }

  // all transfers to accounts outside budget
  get transferOutcome() {
    return this.transfers.reduce(
      (sum, account) => round(sum + account.transferIncome),
      0
    )
  }

  // BUDGETS
  // sum of all budgets for this month
  get budgeted() {
    return this.tags.reduce((sum, tag) => round(sum + tag.totalBudgeted), 0)
  }

  // Overspent needs for next month (sum of all availibles sub zero)
  get overspent() {
    return this.tags.reduce((sum, tag) => round(sum + tag.totalOverspent), 0)
  }
}

//
// HELPERS
//

function round(amount, digits = 2) {
  return +amount.toFixed(2)
}

function calcTagsData(tags, prevTags, transactions, budgets, userInstrument) {
  const metrics = calcMetrics(transactions, userInstrument.rate).byTag
  const result = tags.map((parent, index) => {
    const prevAvailible = prevTags ? prevTags[index].availible : 0
    return {
      ...parent,

      // tag budget || sum of children budgets
      get totalBudgeted() {
        const childrenBudget = this.children.reduce(
          (sum, child) => round(sum + child.budgeted),
          0
        )
        return round(this.budgeted + childrenBudget)
      },

      // sum of all children outcome + parent outcome
      get totalOutcome() {
        return (
          this.outcome +
          this.children.reduce((sum, child) => round(sum + child.outcome), 0)
        )
      },

      // sum of all children income + parent income
      get totalIncome() {
        return (
          this.income +
          this.children.reduce((sum, child) => round(sum + child.income), 0)
        )
      },

      // sum of all children availible + parent availible
      get totalAvailible() {
        return (
          this.availible +
          this.children.reduce((sum, child) => round(sum + child.availible), 0)
        )
      },

      get totalOverspent() {
        const parentOverspent = this.availible < 0 ? -this.availible : 0
        const childrenOverspent = this.children.reduce(
          (sum, child) =>
            child.availible < 0 ? round(sum - child.availible) : sum,
          0
        )
        return parentOverspent + childrenOverspent
      },
      get availible() {
        return round(this.budgeted - this.outcome + this.prevAvailible)
      },

      budgeted: budgets[parent.id] ? budgets[parent.id].outcome : 0,
      outcome: metrics[parent.id] ? metrics[parent.id].outcome : 0, // parent outcome
      income: metrics[parent.id] ? metrics[parent.id].income : 0, // parent income
      prevAvailible: prevAvailible > 0 ? prevAvailible : 0, // availible from previous month (>=0)

      children: parent.children.map((child, childIndex) => {
        const prevAvailible = prevTags
          ? prevTags[index].children[childIndex].availible
          : 0
        return {
          ...child,
          get availible() {
            return round(this.budgeted - this.outcome + this.prevAvailible)
          },

          budgeted: budgets[child.id] ? budgets[child.id].outcome : 0,
          outcome: metrics[child.id] ? metrics[child.id].outcome : 0, // child outcome
          income: metrics[child.id] ? metrics[child.id].income : 0, // child income
          prevAvailible: prevAvailible > 0 ? prevAvailible : 0,
        }
      }),
    }
  })
  return result
}

function groupTransfersOutsideBudget(
  transactions,
  accountsInBudget,
  userInstrument
) {
  const accountIds = accountsInBudget.map(acc => acc.id)
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
        transferOutcome: 0,
      }
    }
    accsById[accId].transferIncome += round(
      (tr.outcome * tr.outcomeInstrument.rate) / userInstrument.rate
    )
  })

  incomeTransfers.forEach(tr => {
    const accId = tr.outcomeAccount.id
    if (!accsById[accId]) {
      accsById[accId] = {
        ...tr.outcomeAccount,
        transferIncome: 0,
        transferOutcome: 0,
      }
    }
    accsById[accId].transferOutcome += round(
      (tr.income * tr.incomeInstrument.rate) / userInstrument.rate
    )
  })

  return Object.keys(accsById).map(id => accsById[id])
}

function calcTransferFees(transactions, accountsInBudget, userInstrument) {
  const accountIds = accountsInBudget.map(acc => acc.id)
  const transfers = transactions.filter(check({ type: 'transfer' }))

  const innerTransfers = transfers.filter(
    tr =>
      accountIds.includes(tr.outcomeAccount.id) &&
      accountIds.includes(tr.incomeAccount.id)
  )
  return innerTransfers.reduce((sum, tr) => {
    return (sum +=
      round((tr.outcome * tr.outcomeInstrument.rate) / userInstrument.rate) -
      round((tr.income * tr.incomeInstrument.rate) / userInstrument.rate))
  }, 0)
}
