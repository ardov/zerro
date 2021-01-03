import { sendEvent } from 'helpers/tracking'
import { AppThunk } from 'store'
import { setTag, getTag } from 'store/localData/tags'
import { OptionalExceptFor, Tag } from 'types'

type TagDraft = OptionalExceptFor<Tag, 'id'>

export const patchTag = (tag: TagDraft): AppThunk => (dispatch, getState) => {
  sendEvent('Tag: edit')
  dispatch(
    setTag({
      ...getTag(getState(), String(tag.id)),
      ...tag,
      changed: Date.now(),
    })
  )
}
