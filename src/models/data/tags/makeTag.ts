import { OptionalExceptFor, TRawTag } from 'shared/types'
import { v1 as uuidv1 } from 'uuid'

type TagDraft = OptionalExceptFor<TRawTag, 'user' | 'title'>

export function makeTag(raw: TagDraft): TRawTag {
  return {
    id: raw.id || uuidv1(),
    changed: raw.changed || Date.now(),
    user: raw.user,
    title: raw.title,
    icon: raw.icon || null,
    budgetIncome: raw.budgetIncome || false,
    budgetOutcome: raw.budgetOutcome || false,
    required: raw.required || false,
    color: raw.color || null,
    picture: raw.picture || null,
    showIncome: raw.showIncome || false,
    showOutcome: raw.showOutcome || false,
    parent: raw.parent || null,
  }
}

export const nullTag = makeTag({
  title: 'Без категории',
  user: 0,
  id: 'null',
  budgetIncome: true,
  budgetOutcome: true,
})
