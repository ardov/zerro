import { createSelector } from '@reduxjs/toolkit'
import { sendEvent } from 'helpers/tracking'
import { ACC_LINKS } from '../constants'
import { setHiddenData } from '../thunks'
import { getTags } from '../../tags'
import { getAccLinks } from '../selectors'
import { AppThunk } from 'store'
import { AccountId, TagId } from 'types'

// THUNK
export const addConnection = (
  account: AccountId,
  tag?: TagId | null
): AppThunk => (dispatch, getState) => {
  const state = getState()
  const accTagMap = getAccTagMap(state)
  const newLinks = { ...accTagMap }
  if (tag) {
    sendEvent('Connection: Add')
    newLinks[account] = tag
  } else {
    sendEvent('Connection: Remove')
    delete newLinks[account]
  }
  dispatch(setHiddenData(ACC_LINKS, newLinks))
}

// SELECTORS
export const getAccTagMap = createSelector(
  [getAccLinks, getTags],
  (links, tags) => {
    if (!links) return {}
    let filtered = { ...links }
    // ignore connections for deleted tags
    for (const accId in filtered) {
      const tagId = filtered[accId]
      if (!tags[tagId]) delete filtered[accId]
    }
    return filtered
  }
)

export const getTagAccMap = createSelector([getAccTagMap], links => {
  let result = {} as { [tagId: string]: AccountId[] }
  Object.entries(links).forEach(([accId, tagId]) => {
    if (result[tagId]) result[tagId].push(accId)
    else result[tagId] = [accId]
  })
  return result
})
