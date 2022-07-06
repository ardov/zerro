import { TZmAdapter } from 'shared/helpers/adapterUtils'
import { IBudget, IZmBudget } from 'shared/types'
import { msToUnix, unixToMs } from 'shared/helpers/date'
import { getBudgetId } from './getBudgetId'

export const convertBudget: TZmAdapter<IZmBudget, IBudget> = {
  toClient: (el: IZmBudget): IBudget => {
    return {
      ...el,
      changed: unixToMs(el.changed),
      id: getBudgetId(el.date, el.tag),
    }
  },
  toServer: (el: IBudget): IZmBudget => {
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
