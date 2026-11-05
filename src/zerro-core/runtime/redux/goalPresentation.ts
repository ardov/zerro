import { t } from 'i18next'
import { parseDate } from '@/6-shared/helpers/date'
import { formatMoney, round } from '@/6-shared/helpers/money'
import type { TDateDraft, TFxCode } from '@/6-shared/types'
import { goalType, type TGoal } from '../../internal/domain/zerro'

export function formatGoal(goal: TGoal, currency?: TFxCode): string {
  const { type, amount, end } = goal
  const sum = formatMoney(amount, currency, 'ifAny')

  switch (type) {
    case goalType.MONTHLY:
      return t('toWords.monthly', { sum, ns: 'goals' })
    case goalType.MONTHLY_SPEND:
      return t('toWords.monthlySpend', { sum, ns: 'goals' })
    case goalType.TARGET_BALANCE:
      return t('toWords.targetBalance', { sum, ns: 'goals' }) + monthSuffix(end)
    case goalType.INCOME_PERCENT:
      return t('toWords.incomePercent', {
        percent: round(amount * 100),
        ns: 'goals',
      })
    default:
      throw new Error(`Unsupported type ${type}`)
  }
}

function monthSuffix(monthDate?: TDateDraft) {
  if (!monthDate) return ''
  const date = parseDate(monthDate)
  const year = date.getFullYear()
  const yearSuffix = new Date().getFullYear() === year ? '' : ` ${year}`
  return (
    ` ${t('toWords.till', {
      context: String(date.getMonth() + 1),
      ns: 'goals',
    })}` + yearSuffix
  )
}
