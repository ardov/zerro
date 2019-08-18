import { checkRaw } from 'store/filterConditions'
import startOfMonth from 'date-fns/start_of_month'
import endOfMonth from 'date-fns/end_of_month'
import { calcMetricsByTag } from 'store/data/transactions/helpers'
import { round, convertAmount } from 'helpers/currencyHelpers'

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
      accounts,
      userInstrument,
      instruments,
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
      checkRaw({ dateFrom: this.date, dateTo: endOfMonth(this.date) })
    )

    this.transfers = groupTransfersOutsideBudget(
      this.transactions,
      accountsInBudget,
      accounts,
      userInstrument,
      instruments
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
      userInstrument,
      instruments
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

  get available() {
    return this.tags.reduce((sum, tag) => {
      return tag.totalAvailable > 0 ? round(sum + tag.totalAvailable) : sum
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

  // Overspent needs for next month (sum of all availables sub zero)
  get overspent() {
    return this.tags.reduce((sum, tag) => round(sum + tag.totalOverspent), 0)
  }
}

function calcTagsData(
  tags,
  prevTags,
  transactions,
  budgets,
  userInstrument,
  instruments
) {
  const metrics = calcMetricsByTag(transactions, userInstrument.id, instruments)
  const result = tags.map((parent, index) => {
    const prevAvailable = prevTags ? prevTags[index].available : 0
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
        const childrenOutcome = this.children.reduce(
          (sum, child) => round(sum + child.outcome),
          0
        )
        return round(this.outcome + childrenOutcome)
      },

      // sum of all children income + parent income
      get totalIncome() {
        const childrenIncome = this.children.reduce(
          (sum, child) => round(sum + child.income),
          0
        )
        return round(this.income + childrenIncome)
      },

      // sum of all children available without overspent + parent available
      get totalAvailable() {
        const childrenAvailable = this.children.reduce((sum, child) => {
          return child.available > 0 ? round(sum + child.available) : sum
        }, 0)
        return round(this.available + childrenAvailable)
      },

      get totalOverspent() {
        return this.available < 0 ? -this.available : 0
      },

      get available() {
        const { prevAvailable, budgeted, outcome, children } = this
        const childrenOverspent = children.reduce(
          (sum, child) =>
            child.available < 0 ? round(sum - child.available) : sum,
          0
        )
        return round(prevAvailable + budgeted - outcome - childrenOverspent)
      },

      budgeted: budgets[parent.id] ? budgets[parent.id].outcome : 0,
      outcome: metrics[parent.id] ? metrics[parent.id].outcome : 0, // parent outcome
      income: metrics[parent.id] ? metrics[parent.id].income : 0, // parent income
      prevAvailable: prevAvailable > 0 ? prevAvailable : 0, // available from previous month (>=0)

      children: parent.children.map((child, childIndex) => {
        const prevAvailable = prevTags
          ? prevTags[index].children[childIndex].available
          : 0
        return {
          ...child,
          get available() {
            return round(this.budgeted - this.outcome + this.prevAvailable)
          },

          budgeted: budgets[child.id] ? budgets[child.id].outcome : 0,
          outcome: metrics[child.id] ? metrics[child.id].outcome : 0, // child outcome
          income: metrics[child.id] ? metrics[child.id].income : 0, // child income
          prevAvailable: prevAvailable > 0 ? prevAvailable : 0,
        }
      }),
    }
  })
  return result
}

function groupTransfersOutsideBudget(
  transactions,
  accountsInBudget,
  accounts,
  userInstrument,
  instruments
) {
  const convert = (amount, instrumentId) =>
    convertAmount(amount, instrumentId, userInstrument.id, instruments)

  const accountIds = accountsInBudget.map(acc => acc.id)
  const transfers = transactions.filter(checkRaw({ type: 'transfer' }))

  const outcomeTransfers = transfers.filter(
    tr => !accountIds.includes(tr.incomeAccount)
  )
  const incomeTransfers = transfers.filter(
    tr => !accountIds.includes(tr.outcomeAccount)
  )

  const accsById = {}

  outcomeTransfers.forEach(tr => {
    const accId = tr.incomeAccount
    if (!accsById[accId]) {
      accsById[accId] = {
        ...accounts[accId],
        transferIncome: 0,
        transferOutcome: 0,
      }
    }
    accsById[accId].transferIncome += convert(tr.outcome, tr.outcomeInstrument)
  })

  incomeTransfers.forEach(tr => {
    const accId = tr.outcomeAccount
    if (!accsById[accId]) {
      accsById[accId] = {
        ...accounts[accId],
        transferIncome: 0,
        transferOutcome: 0,
      }
    }
    accsById[accId].transferOutcome += convert(tr.income, tr.incomeInstrument)
  })
  console.log('accsById', accsById)

  return Object.keys(accsById).map(id => accsById[id])
}

function calcTransferFees(
  transactions,
  accountsInBudget,
  userInstrument,
  instruments
) {
  const convert = (amount, instrumentId) =>
    convertAmount(amount, instrumentId, userInstrument.id, instruments)

  const accountIds = accountsInBudget.map(acc => acc.id)
  const transfers = transactions.filter(checkRaw({ type: 'transfer' }))

  const innerTransfers = transfers.filter(
    tr =>
      accountIds.includes(tr.outcomeAccount.id) &&
      accountIds.includes(tr.incomeAccount.id)
  )
  return innerTransfers.reduce((sum, tr) => {
    return (sum += round(
      convert(tr.outcome, tr.outcomeInstrument) -
        convert(tr.income, tr.incomeInstrument)
    ))
  }, 0)
}
