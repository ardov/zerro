import { TDateDraft, TISODate } from '@shared/types'
import { toISODate } from './utils'

export function makeDateArray(
  from: TDateDraft,
  to: TDateDraft = new Date(),
  aggregation: 'day' | 'month' | 'year' = 'month'
): Array<TISODate> {
  let current = getDate(from, aggregation)
  let last = getDate(to, aggregation)
  const months = [current]
  while (+current < +last) {
    current = new Date(current)
    if (aggregation === 'day') current.setDate(current.getDate() + 1)
    if (aggregation === 'month') current.setMonth(current.getMonth() + 1)
    if (aggregation === 'year') current.setFullYear(current.getFullYear() + 1)
    months.push(current)
  }
  return months.map(toISODate)
}

function getDate(
  d: TDateDraft,
  aggregation: 'day' | 'month' | 'year' = 'month'
) {
  const date = new Date(d)
  switch (aggregation) {
    case 'day':
      return new Date(date.getFullYear(), date.getMonth(), date.getDate())
    case 'month':
      return new Date(date.getFullYear(), date.getMonth(), 1)
    case 'year':
      return new Date(date.getFullYear(), 0, 1)
    default:
      throw new Error('Unknown aggregation ' + aggregation)
  }
}
