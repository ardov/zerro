import { createSelector } from '@reduxjs/toolkit'
import { getTagOrder } from '../selectors'
import { sendEvent } from 'shared/helpers/tracking'
import { setHiddenData } from '../thunks'
import { DataReminderType } from '../constants'
import { getTagsTree } from 'models/tags'
import { TTag, TTagId } from 'shared/types'
import { AppThunk } from 'models'

// THUNKS
export const setTagOrder =
  (order: TTagId[]): AppThunk =>
  (dispatch, getState) => {
    sendEvent(`Tag: sort`)
    dispatch(setHiddenData(DataReminderType.TAG_ORDER, order))
  }

export const moveTag =
  (startIndex: number, endIndex: number): AppThunk =>
  (dispatch, getState) => {
    const state = getState()
    const list = getTagsTree(state).map(tag => tag.id)
    const [removed] = list.splice(startIndex, 1)
    list.splice(endIndex, 0, removed)
    dispatch(setTagOrder(list))
  }

type TagToCompare = Pick<TTag, 'id' | 'name'> & {
  [x: string]: any
}
export const compareTags = createSelector(
  [getTagOrder],
  tagOrder => (tag1: TagToCompare, tag2: TagToCompare) => {
    if (!tagOrder) return tag1.name.localeCompare(tag2.name)

    const i1 = tagOrder.findIndex(id => id === tag1.id)
    const i2 = tagOrder.findIndex(id => id === tag2.id)
    if (i1 === i2) return tag1.name.localeCompare(tag2.name)
    else if (i1 === -1) return 1
    else if (i2 === -1) return -1
    else return i1 - i2
  }
)
