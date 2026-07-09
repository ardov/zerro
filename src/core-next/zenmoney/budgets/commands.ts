import type { TDataStore } from '../store'
import type { TISOMonth } from '../primitives'
import type { TCoreContext, TNormalizedPatch } from '../../types'
import type { TTagId } from '../tags'
import { getRootUserId } from '../users'
import { makeTagBudget } from './factory'
import { getTagBudgetId } from './id'
import { getTagBudgets } from './read'

export type TTagBudgetUpdate = {
  tag: TTagId | null
  month: TISOMonth
  value: number
}

export function compileSetTagBudget(
  data: TDataStore,
  update: TTagBudgetUpdate | TTagBudgetUpdate[],
  ctx: Pick<TCoreContext, 'now'>
): TNormalizedPatch {
  const updates = Array.isArray(update) ? update : [update]
  if (!updates.length) return {}

  const user = getRootUserId(data)
  if (!user) throw new Error('No user')

  const tagBudgets = getTagBudgets(data)

  return {
    budget: updates.map(({ tag, month, value }) => {
      const id = getTagBudgetId(month, tag)
      const current = tagBudgets[id]

      return makeTagBudget(
        {
          ...current,
          user: current?.user || user,
          tag,
          date: month,
          outcome: value,
          changed: ctx.now(),
        },
        ctx
      )
    }),
  }
}
