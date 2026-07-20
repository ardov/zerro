import { toISODate } from '../../foundation/date'
import type { TDataStore } from '../../zenmoney/model/store'
import type { TISOMonth } from '../../zenmoney/primitives'
import type { TCoreContext, TIntentPatch } from '../../../../types'
import type { TEnvelopeId } from '../envelope-id'
import {
  applyIntentPatch,
  compileSetMonthlyHiddenData,
  HiddenDataType,
  mergePatches,
} from '../hidden-data'
import { getRawGoals, type TGoals } from './read'
import { goalType, type TGoal } from './types'

export function compileSetGoal(
  data: TDataStore,
  month: TISOMonth,
  id: TEnvelopeId,
  goal: TGoal | null | undefined,
  ctx: TCoreContext
): TIntentPatch {
  const goals = getRawGoals(data.reminder)
  const newGoal = normalizeGoal(goal)
  const patches: TIntentPatch[] = []
  let state = data

  const addMonthPatch = (targetMonth: TISOMonth, payload: TGoals) => {
    const patch = compileSetMonthlyHiddenData(
      state,
      HiddenDataType.Goals,
      payload,
      targetMonth,
      ctx
    )
    patches.push(patch)
    state = applyIntentPatch(state, patch)
  }

  addMonthPatch(month, {
    ...(goals[month] || {}),
    [id]: newGoal,
  })

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
      const payload = { ...goals[futureBlock] }
      delete payload[id]
      addMonthPatch(futureBlock, payload)
    }
  }

  return mergePatches(...patches)
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
