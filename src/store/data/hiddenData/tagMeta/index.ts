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

export const setTagComment = (
  tagId: TagId | null,
  comment: TagMeta['comment']
): AppThunk => (dispatch, getState) => {
  let id = String(tagId)
  const meta = getMetaForTag(id)(getState())
  if (meta.comment === comment) return
  const newMeta = { ...meta, comment }
  sendEvent('Tag: Set comment')
  dispatch(setTagMeta(id, newMeta))
}

export const setTagCurrency = (
  tagId: TagId | null,
  currency: TagMeta['currency']
): AppThunk => (dispatch, getState) => {
  let id = String(tagId)
  const meta = getMetaForTag(id)(getState())
  if (meta.currency === currency) return
  const newMeta = { ...meta, currency }
  sendEvent('Tag: Set currency')
  dispatch(setTagMeta(id, newMeta))
}

// SELECTORS
export const getTagMeta = createSelector([getRawTagMeta], raw => raw || {})
export const getMetaForTag = (id: TagId) =>
  createSelector([getTagMeta], meta => meta[id] || {})
export const getTagComment = (id: TagId) =>
  createSelector([getTagMeta], meta => meta?.[id]?.comment || '')
