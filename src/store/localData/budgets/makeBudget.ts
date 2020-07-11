interface RawBudget {
  user: number | string
  date: number
  tag: string | null
  changed?: number
  income?: number
  incomeLock?: boolean
  outcome?: number
  outcomeLock?: boolean
}

export const makeBudget = ({
  user,
  date,
  tag,
  changed = Date.now(),
  income = 0,
  incomeLock = true,
  outcome = 0,
  outcomeLock = true,
}: RawBudget): RawBudget => ({
  user,
  date,
  tag: tag === 'null' ? null : tag,
  changed,
  income,
  incomeLock,
  outcome,
  outcomeLock,
})
