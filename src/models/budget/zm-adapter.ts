import { TZmAdapter } from 'shared/helpers/adapterUtils'
import { TBudget, TZmBudget } from './types'
import { msToUnix, unixToMs } from 'shared/helpers/date'
import { getBudgetId } from './getBudgetId'

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
