import { sendEvent } from 'helpers/tracking'
import { AppThunk } from 'store'
import { applyClientPatch } from 'store/dataSlice'
import { getTag } from 'store/localData/tags'
import { OptionalExceptFor, Tag } from 'types'

type TagDraft = OptionalExceptFor<Tag, 'id'>

export const patchTag = (tag: TagDraft): AppThunk => (dispatch, getState) => {
  if (!tag.id) throw new Error('Trying to patch tag without id')
  if (tag.id === 'null') throw new Error('Trying to patch null tag')
  let current = getTag(getState(), tag.id)
  if (!current) throw new Error('Tag not found')

  sendEvent('Tag: edit')
  dispatch(
    applyClientPatch({ tag: [{ ...current, ...tag, changed: Date.now() }] })
  )
}
