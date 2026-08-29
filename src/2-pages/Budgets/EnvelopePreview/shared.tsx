import type { TISOMonth } from '6-shared/types'

/** The surface the preview's own boxes sit on. */
export const cardClass = 'w-full rounded-lg bg-background px-4 py-2'

export function getDateRange(
  dates: TISOMonth[],
  range: number,
  targetMonth: TISOMonth
) {
  let idx = dates.findIndex(d => d === targetMonth)
  if (idx === -1) idx = dates.length - 1
  return trimMonths(dates, range, idx)
}

/** Cuts out a range with target index in center */
export function trimMonths<T>(
  arr: Array<T>,
  windowSize: number,
  targetIdx: number
): Array<T> {
  // In this case the last month is always empty
  // so we can throw it away if it's not the target
  const isLast = targetIdx === arr.length - 1
  const cleanArr = isLast ? arr : arr.slice(0, arr.length - 1)

  if (cleanArr.length <= windowSize) return cleanArr

  // Calculate the range with the target in the center
  const padLeft = Math.floor((windowSize - 1) / 2)
  const padRight = windowSize - 1 - padLeft
  const rangeStart = targetIdx - padLeft
  const rangeEnd = targetIdx + padRight

  if (rangeEnd >= cleanArr.length) return cleanArr.slice(-windowSize)
  if (rangeStart <= 0) return cleanArr.slice(0, windowSize)
  return cleanArr.slice(rangeStart, rangeEnd + 1)
}
