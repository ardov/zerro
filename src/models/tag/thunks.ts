import { sendEvent } from '@shared/helpers/tracking'
import { OptionalExceptFor, ITag, IZmTag } from '@shared/types'
import { AppThunk } from '@store'
import { applyClientPatch } from '@store/data'
import { getRootUser } from '@models/user'
import { getTag } from '@models/tag'
import { makeTag } from './makeTag'

export type TTagDraft = OptionalExceptFor<ITag, 'id'>

export const patchTag =
  (draft: TTagDraft): AppThunk<ITag> =>
  (dispatch, getState): IZmTag => {
    if (!draft.id) throw new Error('Trying to patch tag without id')
    if (draft.id === 'null') throw new Error('Trying to patch null tag')
    let current = getTag(getState(), draft.id)
    if (!current) throw new Error('Tag not found')
    const patched = { ...current, ...draft, changed: Date.now() }

    sendEvent('Tag: edit')
    dispatch(applyClientPatch({ tag: [patched] }))
    return patched
  }

export const createTag =
  (draft: OptionalExceptFor<ITag, 'title'>): AppThunk<ITag> =>
  (dispatch, getState) => {
    if (hasId(draft)) return dispatch(patchTag(draft))
    if (!draft.title) throw new Error('Trying to create tag without title')
    let user = getRootUser(getState())?.id
    if (!user) throw new Error('No user')
    const newTag = makeTag({ ...draft, user })

    sendEvent('Tag: create')
    dispatch(applyClientPatch({ tag: [newTag] }))
    return newTag
  }

const hasId = (tag: Partial<ITag>): tag is TTagDraft => !!tag.id
