import { createSelector } from '@reduxjs/toolkit'
import { getHistoryStart } from 'store/localData/transactions'

export const getAvailableMonths = createSelector([getHistoryStart], start =>
  makeMonthEnds(start)
)

const monthEnd = (d: number | Date) => {
  const date = new Date(d)
  const nextMonthStart = new Date(date.getFullYear(), date.getMonth() + 1, 1)
  return new Date(+nextMonthStart - 1)
}
const monthStart = (d: number | Date) => {
  const date = new Date(d)
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

const makeMonths = (
  start: number | Date = Date.now(),
  end: number | Date = Date.now()
) => {
  let current = monthStart(start)
  const months = [current]
  while (+current < +monthStart(end)) {
    current = new Date(current.getFullYear(), current.getMonth() + 1, 1)
    months.push(current)
  }
  return months
}

const makeMonthEnds = (
  start: number | Date = Date.now(),
  end: number | Date = Date.now()
) => makeMonths(start, end).map(monthEnd)
