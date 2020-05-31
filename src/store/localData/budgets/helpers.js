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
  tag: tag === 'null' ? null : tag,
  changed,
  income,
  incomeLock,
  outcome,
  outcomeLock,
})
