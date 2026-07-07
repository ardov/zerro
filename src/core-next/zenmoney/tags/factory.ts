import type { OptionalExceptFor } from '6-shared/types'
import type { TCoreContext } from '../../types'
import type { TTag, TTagId } from './types'

export function makeTag(
  raw: OptionalExceptFor<TTag, 'user' | 'title'>,
  ctx: Pick<TCoreContext, 'now' | 'uuid'>
): TTag {
  return {
    id: raw.id || (ctx.uuid() as TTagId),
    changed: raw.changed || ctx.now(),
    user: raw.user,
    title: raw.title,
    icon: raw.icon || null,
    budgetIncome: raw.budgetIncome || false,
    budgetOutcome: raw.budgetOutcome || false,
    required: raw.required || false,
    color: raw.color || null,
    picture: raw.picture || null,
    staticId: raw.staticId || null,
    showIncome: raw.showIncome || false,
    showOutcome: raw.showOutcome || false,
    parent: raw.parent || null,
    archive: raw.archive || false,
  }
}
