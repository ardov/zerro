import type { OptionalExceptFor, TTag } from '6-shared/types'
import type { AppThunk } from 'store'
import { sendEvent } from '6-shared/helpers/tracking'
import { applyClientPatch } from 'store/data'
import { userModel } from '5-entities/user'
import { makeTag } from './makeTag'
import { getTags } from './model'

export type TTagDraft = OptionalExceptFor<TTag, 'id'>

export const patchTag =
  (draft: TTagDraft | TTagDraft[]): AppThunk<TTag[]> =>
  (dispatch, getState) => {
    const patched: TTag[] = []
    let list = Array.isArray(draft) ? draft : [draft]

    list.forEach(draft => {
      if (!draft.id) throw new Error('Trying to patch tag without id')
      if (draft.id === 'null') throw new Error('Trying to patch null tag')
      let current = getTags(getState())[draft.id]
      if (!current) throw new Error('Tag not found')
      patched.push({ ...current, ...draft, changed: Date.now() })
    })

    sendEvent('Tag: edit')
    dispatch(applyClientPatch({ tag: patched }))
    return patched
  }

export const createTag =
  (draft: OptionalExceptFor<TTag, 'title'>): AppThunk<TTag[]> =>
  (dispatch, getState) => {
    if (hasId(draft)) return dispatch(patchTag(draft))
    if (!draft.title) throw new Error('Trying to create tag without title')
    let user = userModel.getRootUserId(getState())
    if (!user) throw new Error('No user')
    const newTag = makeTag({ ...draft, user })

    sendEvent('Tag: create')
    dispatch(applyClientPatch({ tag: [newTag] }))
    return [newTag]
  }

const hasId = (tag: Partial<TTag>): tag is TTagDraft => !!tag.id
