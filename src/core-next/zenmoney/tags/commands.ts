import type {
  OptionalExceptFor,
  TDataStore,
  TTag,
  TTagId,
} from '6-shared/types'
import type { TCoreContext, TNormalizedPatch } from '../../types'
import { getRootUserId } from '../users'

export type TZenMoneyTagPatch = OptionalExceptFor<TTag, 'id'>
export type TZenMoneyTagDraft = OptionalExceptFor<TTag, 'title'>

export function compilePatchTag(
  data: TDataStore,
  draft: TZenMoneyTagPatch | TZenMoneyTagPatch[],
  ctx: Pick<TCoreContext, 'now'>
): TNormalizedPatch {
  const list = Array.isArray(draft) ? draft : [draft]

  return {
    tag: list.map(item => {
      if (!item.id) throw new Error('Trying to patch tag without id')
      if (item.id === 'null') throw new Error('Trying to patch null tag')

      const current = data.tag[item.id]
      if (!current) throw new Error('Tag not found')

      return { ...current, ...item, changed: ctx.now() }
    }),
  }
}

export function compileCreateTag(
  data: TDataStore,
  draft: TZenMoneyTagDraft,
  ctx: Pick<TCoreContext, 'now' | 'uuid'>
): TNormalizedPatch {
  if (hasId(draft)) return compilePatchTag(data, draft, ctx)
  if (!draft.title) throw new Error('Trying to create tag without title')

  const user = getRootUserId(data)
  if (!user) throw new Error('No user')

  return {
    tag: [makeTag({ ...draft, user }, ctx)],
  }
}

function makeTag(
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
  }
}

function hasId(tag: Partial<TTag>): tag is TZenMoneyTagPatch {
  return !!tag.id
}
