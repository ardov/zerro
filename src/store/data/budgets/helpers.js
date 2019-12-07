import { goalBudgetDate, goalTypes } from './constants'

export const createBudget = ({
  // required fields
  user,
  date,
  tag,
  // optional fields
  changed = Date.now(),
  income = 0,
  incomeLock = true,
  outcome = 0,
  outcomeLock = true,
}) => ({
  user,
  date,
  tag,
  changed,
  income,
  incomeLock,
  outcome,
  outcomeLock,
})

export const createGoal = ({
  user,
  tag,
  type,
  amount,
  date,
  changed = Date.now(),
}) => ({
  user,
  tag,
  changed,
  date: goalBudgetDate,
  income: encodeGoal(type, date),
  incomeLock: true,
  outcome: amount,
  outcomeLock: true,
})

export const parseGoal = ({ income, outcome }) =>
  outcome ? { amount: outcome, ...decodeGoal(income) } : null

const encodeGoal = (type, date) => {
  const typeId = goalTypes.findIndex(goalType => goalType === type)
  if (!date) return typeId
  const year = new Date(date).getFullYear() - 2000
  const month = new Date(date).getMonth()
  return (year << 8) + (month << 4) + typeId
}

const decodeGoal = int => {
  if (int <= 0b1111) return { type: goalTypes[int] }
  const type = goalTypes[int & 0b1111]
  const month = (int >> 4) & 0b1111
  const year = int >> 8
  return { type, date: +new Date(year + 2000, month) }
}
