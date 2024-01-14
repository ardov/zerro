import { TISODate } from '6-shared/types'
import { GroupBy, toGroup, toISODate } from '6-shared/helpers/date'
import { useTranslation } from 'react-i18next'

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
  throw new Error(`Unknown period: ${period}`)
}

const order = [Period.All, Period.LastYear, Period.ThreeYears]
export const nextPeriod = (current: Period) => {
  const currIdx = order.findIndex(p => p === current)
  const nextIdx = (currIdx + 1) % order.length
  return order[nextIdx]
}

/**
 * Returns the localized title of the period
 */
export const PeriodTitle = (props: { period: Period }) => {
  const { t } = useTranslation('analytics')
  const { period } = props
  if (period === Period.All) return t('period_all')
  if (period === Period.LastYear) return t('period_year')
  if (period === Period.ThreeYears) return t('period_3years')
  console.error(`Unknown period: ${period}`)
  return null
}
