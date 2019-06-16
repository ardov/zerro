import { check } from '../../../filterConditions'
import startOfMonth from 'date-fns/start_of_month'
import endOfMonth from 'date-fns/end_of_month'
import { calcMetrics } from '../Utils/transactions'

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

    this.budgets = budgets

    this.transactions = transactions.filter(
      check({ dateFrom: this.date, dateTo: this.endOfMonth })
    )

    this.transfers = groupTransfersOutsideBudget(
      this.transactions,
      accountsInBalance,
      userInstrument
    )

    this.tags = calcTagsData(
      tags,
      this.prevTags,
      this.transactions,
      budgets,
      userInstrument
    )
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
    return +(
      prevFunds -
      prevOverspent +
      income +
      transferIncome -
      transferOutcome
    ).toFixed(2)
  }

  // all income this month
  get income() {
    return this.tags.reduce(
      (sum, tag) => +(sum + tag.totalIncome).toFixed(2),
      0
    )
  }

  // all transfers from accounts outside budget
  get transferIncome() {
    return this.transfers.reduce(
      (sum, account) => +(sum + account.transferOutcome).toFixed(2),
      0
    )
  }

  // all transfers to accounts outside budget
  get transferOutcome() {
    return this.transfers.reduce(
      (sum, account) => +(sum + account.transferIncome).toFixed(2),
      0
    )
  }

  // BUDGETS
  // sum of all budgets for this month
  get budgeted() {
    return this.tags.reduce(
      (sum, tag) => +(sum + tag.totalBudgeted).toFixed(2),
      0
    )
  }

  // Overspent needs for next month (sum of all availibles sub zero)
  get overspent() {
    return this.tags.reduce(
      (sum, tag) => +(sum + tag.totalOverspent).toFixed(2),
      0
    )
  }
}

//
//

function calcTagsData(tags, prevTags, transactions, budgets, userInstrument) {
  const metrics = calcMetrics(transactions, userInstrument.rate).byTag
  const result = tags.map((parent, index) => {
    const prevAvailible = prevTags ? prevTags[index].availible : 0
    return {
      // ...parent,
      a: parent.title,

      // tag budget || sum of children budgets
      get totalBudgeted() {
        if (!this.children) debugger
        return this.budgeted
          ? this.budgeted
          : this.children.reduce(
              (sum, child) => +(sum + child.budgeted).toFixed(2),
              0
            )
      },

      // sum of all children outcome + parent outcome
      get totalOutcome() {
        return (
          this.outcome +
          this.children.reduce(
            (sum, child) => +(sum + child.outcome).toFixed(2),
            0
          )
        )
      },

      // sum of all children income + parent income
      get totalIncome() {
        return (
          this.income +
          this.children.reduce(
            (sum, child) => +(sum + child.income).toFixed(2),
            0
          )
        )
      },

      // sum of all children availible + parent availible
      get totalAvailible() {
        return (
          this.availible +
          this.children.reduce(
            (sum, child) => +(sum + child.availible).toFixed(2),
            0
          )
        )
      },

      get totalOverspent() {
        const parentOverspent = this.availible < 0 ? -this.availible : 0
        const childrenOverspent = this.children.reduce(
          (sum, child) =>
            child.availible < 0 ? +(sum - child.availible).toFixed(2) : sum,
          0
        )
        return parentOverspent + childrenOverspent
      },
      get availible() {
        return +(this.budgeted - this.outcome + this.prevAvailible).toFixed(2)
      },

      budgeted: budgets[parent.id] ? budgets[parent.id].outcome : 0,
      outcome: metrics[parent.id] ? metrics[parent.id].outcome : 0, // parent outcome
      income: metrics[parent.id] ? metrics[parent.id].income : 0, // parent income
      prevAvailible: prevAvailible > 0 ? prevAvailible : 0, // availible from previous month (>=0)

      children: parent.children.map((child, index2) => {
        const prevAvailible = prevTags
          ? prevTags[index].children[index2].availible
          : 0
        return {
          ...child,
          get availible() {
            return +(this.budgeted - this.outcome + this.prevAvailible).toFixed(
              2
            )
          },

          budgeted: budgets[child.id] ? budgets[child.id].outcome : 0,
          outcome: metrics[child.id] ? metrics[child.id].outcome : 0, // child outcome
          income: metrics[child.id] ? metrics[child.id].income : 0, // child income
          prevAvailible: prevAvailible > 0 ? prevAvailible : 0
        }
      })
    }
  })
  return result
}

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
    accsById[accId].transferIncome += +(
      (tr.outcome * tr.outcomeInstrument.rate) /
      userInstrument.rate
    ).toFixed(2)
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
    accsById[accId].transferOutcome += +(
      (tr.income * tr.incomeInstrument.rate) /
      userInstrument.rate
    ).toFixed(2)
  })

  return Object.keys(accsById).map(id => accsById[id])
}
