import { toISODate } from '../../shared/date'
import type { TDataStore } from '../../zenmoney/store'
import type { TISOMonth } from '../../zenmoney/primitives'
import type { TCoreContext, TNormalizedPatch } from '../../types'
import { applyPatch } from '../../zenmoney'
import type { TEnvelopeId } from '../envelope-id'
import {
  compileSetMonthlyHiddenData,
  HiddenDataType,
  mergeNormalizedPatches,
} from '../hidden-data'
import { getRawGoals, type TGoals } from './read'
import { goalType, type TGoal } from './types'

export function compileSetGoal(
  data: TDataStore,
  month: TISOMonth,
  id: TEnvelopeId,
  goal: TGoal | null | undefined,
  ctx: Pick<TCoreContext, 'now' | 'uuid'>
): TNormalizedPatch {
  const goals = getRawGoals(data)
  const newGoal = makeGoal(goal)
  const patches: TNormalizedPatch[] = []
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
    state = applyPatch(state, patch)
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

  return mergeNormalizedPatches(...patches)
}

function makeGoal(goalDraft?: TGoal | null): TGoal | null {
  const { type, amount, end } = goalDraft || {}
  if (!type || !amount) return null

  switch (type) {
    case goalType.MONTHLY:
    case goalType.MONTHLY_SPEND:
    case goalType.INCOME_PERCENT:
      return { type, amount }
    case goalType.TARGET_BALANCE:
      return end
        ? { type, amount, end: toISODate(end) }
        : { type, amount }
    default:
      return null
  }
}
