import type { OptionalExceptFor } from '../../shared/types'
import type { TDataStore } from '../store'
import type { TCoreContext, TNormalizedPatch } from '../../../types'
import { getRootUserId } from '../users'
import { makeTag } from './factory'
import { getTags } from './read'
import type { TTag } from './types'

export type TTagPatch = OptionalExceptFor<TTag, 'id'>
export type TTagDraft = OptionalExceptFor<TTag, 'title'>

export function compilePatchTag(
  data: TDataStore,
  draft: TTagPatch | TTagPatch[],
  ctx: Pick<TCoreContext, 'now'>
): TNormalizedPatch {
  const list = Array.isArray(draft) ? draft : [draft]

  return {
    tag: list.map(item => {
      if (!item.id) throw new Error('Trying to patch tag without id')
      if (item.id === 'null') throw new Error('Trying to patch null tag')

      const current = getTags(data)[item.id]
      if (!current) throw new Error('Tag not found')

      return { ...current, ...item, changed: ctx.now() }
    }),
  }
}

export function compileCreateTag(
  data: TDataStore,
  draft: TTagDraft,
  ctx: TCoreContext
): TNormalizedPatch {
  if (hasId(draft)) return compilePatchTag(data, draft, ctx)
  if (!draft.title) throw new Error('Trying to create tag without title')

  const user = getRootUserId(data)
  if (!user) throw new Error('No user')

  return {
    tag: [makeTag({ ...draft, user }, ctx)],
  }
}

function hasId(tag: Partial<TTag>): tag is TTagPatch {
  return !!tag.id
}
