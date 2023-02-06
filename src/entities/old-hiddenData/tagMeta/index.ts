import { createSelector } from '@reduxjs/toolkit'
import { sendEvent } from '@shared/helpers/tracking'
import { DataReminderType } from '../constants'
import { setHiddenData } from '../thunks'
import { getRawTagMeta } from '../selectors'
import { AppThunk } from '@store'
import { TTagMeta } from '@shared/types'
import { TTagId } from '@shared/types'

// THUNK
export const setTagMeta =
  (tag: TTagId | null, meta?: TTagMeta): AppThunk =>
  (dispatch, getState) => {
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

export const setTagComment =
  (tagId: TTagId | null, comment: TTagMeta['comment']): AppThunk =>
  (dispatch, getState) => {
    let id = String(tagId)
    const meta = getMetaForTag(id)(getState())
    if (meta.comment === comment) return
    const newMeta = { ...meta, comment }
    sendEvent('Tag: Set comment')
    dispatch(setTagMeta(id, newMeta))
  }

export const setTagCurrency =
  (tagId: TTagId | null, currency: TTagMeta['currency']): AppThunk =>
  (dispatch, getState) => {
    let id = String(tagId)
    const meta = getMetaForTag(id)(getState())
    if (meta.currency === currency) return
    const newMeta = { ...meta, currency }
    sendEvent('Tag: Set currency')
    dispatch(setTagMeta(id, newMeta))
  }

// SELECTORS
export const getTagMeta = createSelector([getRawTagMeta], raw => raw || {})
export const getMetaForTag = (id: TTagId) =>
  createSelector([getTagMeta], meta => meta[id] || {})
export const getTagComment = (id: TTagId) =>
  createSelector([getTagMeta], meta => meta?.[id]?.comment || '')
