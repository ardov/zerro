export function makeDateArray(
  from: number | string | Date,
  to: number | string | Date = new Date(),
  aggregation: 'day' | 'month' | 'year' = 'month'
) {
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
  return months
}

export function monthEnd(d: number | Date) {
  const date = new Date(d)
  const nextMonthStart = new Date(date.getFullYear(), date.getMonth() + 1, 1)
  return new Date(+nextMonthStart - 1)
}

export function monthStart(d: number | Date) {
  const date = new Date(d)
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function getDate(
  d: number | string | Date,
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
