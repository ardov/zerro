import { TBudget, TZmBudget } from 'shared/types'
import { msToISODate, msToUnix, TZmAdapter, zmDateToMs } from './utils'

export const convertBudget: TZmAdapter<TZmBudget, TBudget> = {
  toClient: (el: TZmBudget): TBudget => {
    return {
      ...el,
      changed: zmDateToMs(el.changed),
      date: zmDateToMs(el.date),
    }
  },
  toServer: (el: TBudget): TZmBudget => {
    return {
      ...el,
      changed: msToUnix(el.changed),
      date: msToISODate(el.date),
    }
  },
}

export function getBudgetId(budget: TBudget) {
  return `${budget.tag},${msToISODate(budget.date)}`
}
