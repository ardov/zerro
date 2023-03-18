import { oldGoalType } from '../constants'
import { TDateDraft, TOldGoal } from '@shared/types'
import { formatMoney } from '@shared/helpers/money'
import { parseDate } from '@shared/helpers/date'

const { MONTHLY, MONTHLY_SPEND, TARGET_BALANCE } = oldGoalType

const formatMonth = (monthDate: TDateDraft): string => {
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

export const goalToWords = ({ type, amount, end }: TOldGoal): string => {
  const formattedSum = formatMoney(amount, null, 0)
  switch (type) {
    case MONTHLY:
      return `Откладываю ${formattedSum} каждый месяц`
    case MONTHLY_SPEND:
      return `Нужно ${formattedSum} на месяц`
    case TARGET_BALANCE:
      if (end) return `Хочу накопить ${formattedSum} к ${formatMonth(end)}`
      else return `Хочу накопить ${formattedSum}`
    default:
      throw new Error(`Unsupported type ${type}`)
  }
}

export const makeGoal = ({ type, amount, end }: TOldGoal): TOldGoal => {
  return { type, amount, end }
}
