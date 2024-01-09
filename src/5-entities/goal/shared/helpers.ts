import { goalType, TGoal } from './types'
import { TDateDraft, TFxCode } from '6-shared/types'
import { formatMoney, round } from '6-shared/helpers/money'
import { parseDate, toISODate } from '6-shared/helpers/date'
import { t } from 'i18next'

export const makeGoal = (goalDraft?: TGoal | null): TGoal | null => {
  const { type, amount, end } = goalDraft || {}
  if (!type || !amount) return null
  switch (type) {
    case goalType.MONTHLY:
    case goalType.MONTHLY_SPEND:
    case goalType.INCOME_PERCENT:
      return { type, amount }
    case goalType.TARGET_BALANCE:
      if (end) {
        return { type, amount, end: toISODate(end) }
      } else {
        return { type, amount }
      }
    default:
      return null
  }
}

export const goalToWords = (
  { type, amount, end }: TGoal,
  currency?: TFxCode
): string => {
  const sum = formatMoney(amount, currency, 0)
  switch (type) {
    case goalType.MONTHLY:
      return t('toWords.monthly', { sum, ns: 'goals' })
    case goalType.MONTHLY_SPEND:
      return t('toWords.monthlySpend', { sum, ns: 'goals' })
    case goalType.TARGET_BALANCE:
      return t('toWords.targetBalance', { sum, ns: 'goals' }) + monthSuffix(end)
    case goalType.INCOME_PERCENT:
      const percent = round(amount * 100)
      return t('toWords.incomePercent', { percent, ns: 'goals' })
    default:
      throw new Error(`Unsupported type ${type}`)
  }
}

function monthSuffix(monthDate?: TDateDraft) {
  if (!monthDate) return ''
  const date = parseDate(monthDate)
  const YYYY = date.getFullYear()
  const isSameYear = new Date().getFullYear() === YYYY
  const yearAddon = isSameYear ? '' : ' ' + YYYY
  const context = date.getMonth() + 1
  return ` ${t('toWords.till', { context, ns: 'goals' })}` + yearAddon
}
