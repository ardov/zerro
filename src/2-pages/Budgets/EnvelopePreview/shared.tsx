import type { TISOMonth } from '6-shared/types'

export const cardStyle = {
  borderRadius: 1,
  py: 1,
  px: 2,
  bgcolor: 'background.default',
  width: '100%',
}

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
  let padLeft = Math.floor((windowSize - 1) / 2)
  let padRight = windowSize - 1 - padLeft
  let rangeStart = targetIdx - padLeft
  let rangeEnd = targetIdx + padRight

  if (rangeEnd >= cleanArr.length) return cleanArr.slice(-windowSize)
  if (rangeStart <= 0) return cleanArr.slice(0, windowSize)
  return cleanArr.slice(rangeStart, rangeEnd + 1)
}
