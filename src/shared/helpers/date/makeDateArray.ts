import { TDateDraft, TISODate } from '@shared/types'
import { nextDay, nextMonth, nextYear, toISODate } from './utils'

export enum GroupBy {
  Day = 'day',
  Month = 'month',
  Year = 'year',
}

export function toGroup(date: TDateDraft, aggregation: GroupBy): TISODate {
  const isoDate = toISODate(date)
  switch (aggregation) {
    case GroupBy.Year:
      return (isoDate.slice(0, 4) + '-01-01') as TISODate
    case GroupBy.Month:
      return (isoDate.slice(0, 7) + '-01') as TISODate
    case GroupBy.Day:
      return isoDate
    default:
      throw new Error('Unknown aggregation', aggregation)
  }
}

export function nextGroup(date: TDateDraft, aggregation: GroupBy): TISODate {
  const currGroup = toGroup(date, aggregation)
  switch (aggregation) {
    case GroupBy.Year:
      return toISODate(nextYear(currGroup))
    case GroupBy.Month:
      return toISODate(nextMonth(currGroup))
    case GroupBy.Day:
      return toISODate(nextDay(currGroup))
    default:
      throw new Error('Unknown aggregation', aggregation)
  }
}

export function makeDateArray(
  from: TDateDraft,
  to: TDateDraft = new Date(),
  aggregation: GroupBy = GroupBy.Month
): Array<TISODate> {
  let current = toGroup(from, aggregation)
  let last = toGroup(to, aggregation)
  const months = [current]
  while (current < last) {
    current = nextGroup(current, aggregation)
    months.push(current)
  }
  return months
}
