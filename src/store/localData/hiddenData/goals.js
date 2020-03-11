import { GOAL_TYPES } from './constants'
import { formatMoney } from 'helpers/format'

const { MONTHLY, MONTHLY_SPEND, TARGET_BALANCE } = GOAL_TYPES

export const goalToWords = ({ type, amount, end }) => {
  const formattedSum = formatMoney(amount, null, 0)
  switch (type) {
    case MONTHLY:
      return `Откладывать ${formattedSum} каждый месяц`
    case MONTHLY_SPEND:
      return `Тратить ${formattedSum} каждый месяц`
    case TARGET_BALANCE:
      return `Накопить ${formattedSum} к ${new Date(end).toLocaleDateString()}`
    default:
      throw new Error(`Unsupported type ${type}`)
  }
}
