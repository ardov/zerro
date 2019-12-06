export function createBudget({
  // required
  user,
  date,
  tag,

  // optional
  changed = Date.now(),
  income = 0,
  incomeLock = true,
  outcome = 0,
  outcomeLock = true,
}) {
  return {
    user,
    date,
    tag,
    changed,
    income,
    incomeLock,
    outcome,
    outcomeLock,
  }
}
