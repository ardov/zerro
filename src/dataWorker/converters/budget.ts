import { TBudget, TZmBudget } from 'shared/types'
import { TZmAdapter } from 'shared/helpers/adapterUtils'
import { getBudgetId } from 'models/budgets'
import { msToUnix, unixToMs } from 'shared/helpers/date'

export const convertBudget: TZmAdapter<TZmBudget, TBudget> = {
  toClient: (el: TZmBudget): TBudget => {
    return {
      ...el,
      changed: unixToMs(el.changed),
      id: getBudgetId(el.date, el.tag),
    }
  },
  toServer: (el: TBudget): TZmBudget => {
    return {
      changed: msToUnix(el.changed),
      user: el.user,
      tag: el.tag,
      date: el.date,
      income: el.income,
      incomeLock: el.incomeLock,
      outcome: el.outcome,
      outcomeLock: el.outcomeLock,
    }
  },
}
