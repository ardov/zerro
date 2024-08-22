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
  const idx = dates.findIndex(d => d === targetMonth)
  const arrayToTrim =
    idx === dates.length - 1 ? dates : dates.slice(0, dates.length - 1)
  if (idx === -1) return trimArray(arrayToTrim, range)
  return trimArray(arrayToTrim, range, idx)
}

/** Cuts out a range with target index in center */
function trimArray<T>(
  arr: Array<T> = [],
  range = 1,
  targetIdx?: number
): Array<T> {
  if (arr.length <= range) return arr
  if (targetIdx === undefined) return arr.slice(-range)

  let padLeft = Math.floor((range - 1) / 2)
  let padRight = range - 1 - padLeft
  let rangeStart = targetIdx - padLeft
  let rangeEnd = targetIdx + padRight

  if (rangeEnd >= arr.length) return arr.slice(-range)
  if (rangeStart <= 0) return arr.slice(0, range)
  return arr.slice(rangeStart, rangeEnd + 1)
}
