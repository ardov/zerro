import { createSelector } from 'redux-starter-kit'
import { getRawTagOrder } from '../selectors'
import { sendEvent } from 'helpers/tracking'
import { setHiddenData } from '../thunks'
import { TAG_ORDER } from '../constants'
import { getTagsTree } from 'store/localData/tags'

// THUNKS
export const setTagOrder = order => (dispatch, getState) => {
  sendEvent(`Tag: sort`)
  dispatch(setHiddenData(TAG_ORDER, order))
}

export const moveTag = (startIndex, endIndex) => (dispatch, getState) => {
  const state = getState()
  const list = getTagsTree(state).map(tag => tag.id)
  const [removed] = list.splice(startIndex, 1)
  list.splice(endIndex, 0, removed)
  dispatch(setTagOrder(list))
}

export const compareTags = createSelector(
  [getRawTagOrder],
  tagOrder => (tag1, tag2) => {
    if (!tagOrder) return tag1.name.localeCompare(tag2.name)

    const i1 = tagOrder.findIndex(id => id === tag1.id)
    const i2 = tagOrder.findIndex(id => id === tag2.id)
    if (i1 === i2) return tag1.name.localeCompare(tag2.name)
    else if (i1 === -1) return 1
    else if (i2 === -1) return -1
    else return i1 - i2
  }
)
