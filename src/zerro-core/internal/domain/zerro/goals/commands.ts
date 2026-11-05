import { toISODate } from '../../foundation/date'
import type { TDataStore } from '../../zenmoney/model/store'
import type { TISOMonth } from '../../zenmoney/primitives'
import type { TCoreContext } from '../../../../types'
import type { TEnvelopeId } from '../envelope-id'
import { prepareZerro } from '../operations/prepare'
import type { TZerroIntent } from '../operations/types'
import { getRawGoals } from './read'
import { goalType, type TGoal } from './types'

export function compileSetGoal(
  data: TDataStore,
  month: TISOMonth,
  id: TEnvelopeId,
  goal: TGoal | null | undefined,
  ctx: TCoreContext
) {
  const goals = getRawGoals(data.reminder)
  const newGoal = normalizeGoal(goal)
  const intents: TZerroIntent[] = [
    newGoal
      ? {
          type: 'goals.set',
          month,
          envelopeId: id,
          goal: newGoal as Extract<TZerroIntent, { type: 'goals.set' }>['goal'],
        }
      : { type: 'goals.stop', month, envelopeId: id },
  ]

  if (newGoal) {
    const futureBlock = Object.keys(goals)
      .sort((a, b) => a.localeCompare(b))
      .filter(date => date > month)
      .find(date => {
        const futureGoals = goals[date as TISOMonth]
        if (futureGoals[id] === null) return true
        return !!futureGoals[id]
      }) as TISOMonth | undefined

    if (futureBlock && goals[futureBlock][id] === null) {
      intents.push({
        type: 'goals.clearOverride',
        month: futureBlock,
        envelopeId: id,
      })
    }
  }

  return prepareZerro(data, intents, ctx)
}

function normalizeGoal(goalDraft?: TGoal | null): TGoal | null {
  const { type, amount, end } = goalDraft || {}
  if (!type || !amount) return null

  switch (type) {
    case goalType.MONTHLY:
    case goalType.MONTHLY_SPEND:
    case goalType.INCOME_PERCENT:
      return { type, amount }
    case goalType.TARGET_BALANCE:
      return end ? { type, amount, end: toISODate(end) } : { type, amount }
    default:
      return null
  }
}
