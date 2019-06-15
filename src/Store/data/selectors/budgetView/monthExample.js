export const monthExample = {
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
