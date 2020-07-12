import { GOAL_TYPES, GoalType } from '../constants'
import { formatMoney } from 'helpers/format'
import parseDate from 'date-fns/parseISO'
import { format } from 'date-fns'
import { ZmGoal, Goal } from 'types'

const { MONTHLY, MONTHLY_SPEND, TARGET_BALANCE } = GOAL_TYPES

const formatMonth = (monthDate: number | Date): string => {
  if (!monthDate) return ''
  const date = new Date(monthDate)
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

export const goalToWords = ({
  type,
  amount,
  end,
}: {
  type: GoalType
  amount: number
  end?: number | Date
}) => {
  const formattedSum = formatMoney(amount, null, 0)
  switch (type) {
    case MONTHLY:
      return `Откладываю ${formattedSum} каждый месяц`
    case MONTHLY_SPEND:
      return `Планирую тратить ${formattedSum} в месяц`
    case TARGET_BALANCE:
      if (end) return `Хочу накопить ${formattedSum} к ${formatMonth(end)}`
      else return `Хочу накопить ${formattedSum}`
    default:
      throw new Error(`Unsupported type ${type}`)
  }
}

export const makeGoal = ({ type, amount, end }: Goal): ZmGoal => {
  let goal: ZmGoal = { type, amount }
  if (end && type === TARGET_BALANCE) goal.end = format(end, 'yyyy-MM')
  return goal
}

export const parseGoal = ({ type, amount, end }: ZmGoal): Goal => {
  let goal: Goal = { type, amount }
  if (end) goal.end = +parseDate(end)
  return goal
}
