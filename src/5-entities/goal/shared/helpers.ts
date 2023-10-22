import { goalType, TGoal } from './types'
import { TDateDraft, TFxCode } from '6-shared/types'
import { formatMoney, round } from '6-shared/helpers/money'
import { parseDate, toISODate } from '6-shared/helpers/date'

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

// TODO: i18n
export const goalToWords = (
  { type, amount, end }: TGoal,
  currency?: TFxCode
): string => {
  const formattedSum = formatMoney(amount, currency, 0)
  switch (type) {
    case goalType.MONTHLY:
      return `Откладываю ${formattedSum} каждый месяц`
    case goalType.MONTHLY_SPEND:
      return `Нужно ${formattedSum} на месяц`
    case goalType.TARGET_BALANCE:
      if (end) return `Хочу накопить ${formattedSum} к ${formatMonth(end)}`
      else return `Хочу накопить ${formattedSum}`
    case goalType.INCOME_PERCENT:
      return `Откладываю ${round(amount * 100)}% от дохода`
    default:
      throw new Error(`Unsupported type ${type}`)
  }
}

function formatMonth(monthDate: TDateDraft) {
  if (!monthDate) return ''
  const date = parseDate(monthDate)
  const MM = date.getMonth()
  const YYYY = date.getFullYear()
  const isSameYear = new Date().getFullYear() === YYYY
  const months = [
    'январю',
    'февралю',
    'марту',
    'апрелю',
    'маю',
    'июню',
    'июлю',
    'августу',
    'сентябрю',
    'октябрю',
    'ноябрю',
    'декабрю',
  ]
  return `${months[MM]} ${isSameYear ? 'этого года' : YYYY}`
}
