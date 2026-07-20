import type { OptionalExceptFor } from '../../shared/types'
import type { TDataStore } from '../store'
import type { TCoreContext, TIntentPatch } from '../../../types'
import { getRootUserId } from '../users'
import { makeTag } from './factory'
import { getTags } from './read'
import type { TTag, TTagPatch } from './types'

export type TTagDraft = OptionalExceptFor<TTag, 'title'>

export function compilePatchTag(
  data: TDataStore,
  draft: TTagPatch | TTagPatch[]
): TIntentPatch {
  const list = Array.isArray(draft) ? draft : [draft]

  list.forEach(item => {
    if (!item.id) throw new Error('Trying to patch tag without id')
    if (item.id === 'null') throw new Error('Trying to patch null tag')
    if (!getTags(data)[item.id]) throw new Error('Tag not found')
  })

  return { tag: list }
}

export function compileCreateTag(
  data: TDataStore,
  draft: TTagDraft,
  ctx: TCoreContext
): TIntentPatch {
  if (hasId(draft)) return compilePatchTag(data, draft)
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
