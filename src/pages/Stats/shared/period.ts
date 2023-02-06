import { TISODate } from '@shared/types'
import { GroupBy, toGroup, toISODate } from '@shared/helpers/date'

export enum Period {
  LastYear = 'LastYear',
  ThreeYears = 'ThreeYears',
  All = 'All',
}

export function getStart(
  period: Period,
  aggregation: GroupBy
): TISODate | undefined {
  if (period === Period.All) return undefined //'2000-01-01' as TISODate
  if (period === Period.LastYear) {
    const date = new Date()
    date.setFullYear(date.getFullYear() - 1)
    return toGroup(toISODate(date), aggregation)
  }
  if (period === Period.ThreeYears) {
    const date = new Date()
    date.setFullYear(date.getFullYear() - 3)
    return toGroup(toISODate(date), aggregation)
  }
  throw new Error('Unknown period: ', period)
}

export const periodTitles = {
  [Period.All]: 'за всё время',
  [Period.LastYear]: 'за год',
  [Period.ThreeYears]: 'за три года',
}

const order = [Period.All, Period.LastYear, Period.ThreeYears]
export const nextPeriod = (current: Period) => {
  const currIdx = order.findIndex(p => p === current)
  const nextIdx = (currIdx + 1) % order.length
  return order[nextIdx]
}
