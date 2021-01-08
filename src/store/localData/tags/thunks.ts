import { sendEvent } from 'helpers/tracking'
import { AppThunk } from 'store'
import { setTag, getTag } from 'store/localData/tags'
import { OptionalExceptFor, Tag } from 'types'

type TagDraft = OptionalExceptFor<Tag, 'id'>

export const patchTag = (tag: TagDraft): AppThunk => (dispatch, getState) => {
  if (!tag.id) throw new Error('Trying to patch tag without id')
  if (tag.id === 'null') throw new Error('Trying to patch null tag')

  sendEvent('Tag: edit')
  dispatch(
    setTag({
      ...getTag(getState(), String(tag.id)),
      ...tag,
      changed: Date.now(),
    })
  )
}
