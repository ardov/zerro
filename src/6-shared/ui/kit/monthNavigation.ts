import { toISOMonth } from '@/6-shared/helpers/date'
import type { TISOMonth } from '@/6-shared/types'

const steps: Record<string, number> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: -3,
  ArrowDown: 3,
}

/** Keys the month grid owns, even when they cannot move any further. */
export function isMonthGridKey(key: string) {
  return Object.hasOwn(steps, key)
}

/** Move within a three-column month grid; horizontal row edges page years. */
export function nextMonth(
  from: TISOMonth,
  key: string,
  { minMonth, maxMonth }: { minMonth?: TISOMonth; maxMonth?: TISOMonth } = {}
): TISOMonth | null {
  if (!isMonthGridKey(key)) return null
  const step = steps[key]
  const year = Number(from.slice(0, 4))
  const index = Number(from.slice(5)) - 1
  const allowed = (month: TISOMonth) =>
    (!minMonth || month >= minMonth) && (!maxMonth || month <= maxMonth)
  if ((step === -1 && index % 3 === 0) || (step === 1 && index % 3 === 2)) {
    const nextYear = year + step
    const target = toISOMonth(new Date(nextYear, index + (step === 1 ? -2 : 2)))
    const clamped =
      minMonth && target < minMonth
        ? minMonth
        : maxMonth && target > maxMonth
          ? maxMonth
          : target
    return Number(clamped.slice(0, 4)) === nextYear ? clamped : null
  }
  for (let next = index + step; next >= 0 && next < 12; next += step) {
    if (Math.abs(step) === 1 && Math.floor(next / 3) !== Math.floor(index / 3))
      break
    const month = toISOMonth(new Date(year, next))
    if (allowed(month)) return month
  }
  return null
}
