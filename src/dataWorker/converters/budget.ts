import { TBudget, TZmBudget } from 'shared/types'
import {
  msToISODate,
  msToUnix,
  TZmAdapter,
  zmDateToMs,
} from 'shared/helpers/adapterUtils'

export const convertBudget: TZmAdapter<TZmBudget, TBudget> = {
  toClient: (el: TZmBudget): TBudget => {
    return {
      ...el,
      changed: zmDateToMs(el.changed),
      date: zmDateToMs(el.date),
      id: `${el.date}#${el.tag}`,
    }
  },
  toServer: (el: TBudget): TZmBudget => {
    return {
      changed: msToUnix(el.changed),
      user: el.user,
      tag: el.tag,
      date: msToISODate(el.date),
      income: el.income,
      incomeLock: el.incomeLock,
      outcome: el.outcome,
      outcomeLock: el.outcomeLock,
    }
  },
}
