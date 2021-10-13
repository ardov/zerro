import { createSelector } from '@reduxjs/toolkit'
import { sendEvent } from 'helpers/tracking'
import { DataReminderType } from '../constants'
import { setHiddenData } from '../thunks'
import { getRawTagMeta } from '../selectors'
import { AppThunk } from 'store'
import { TagMeta, TagId } from 'types'

// THUNK
export const setTagMeta = (tag: TagId | null, meta?: TagMeta): AppThunk => (
  dispatch,
  getState
) => {
  const state = getState()
  const metaByTags = getRawTagMeta(state)
  const data = { ...metaByTags }
  let tagId = tag || 'null'
  if (meta) {
    sendEvent('Tag: Set meta')
    data[tagId] = meta
  } else {
    sendEvent('Tag: Remove meta')
    delete data[tagId]
  }
  dispatch(setHiddenData(DataReminderType.TAG_META, data))
}

// SELECTORS
export const getTagMeta = createSelector([getRawTagMeta], raw => raw || {})
export const getMetaForTag = (id: TagId) =>
  createSelector([getTagMeta], meta => meta[id] || {})
