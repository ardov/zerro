import { createSelector } from '@reduxjs/toolkit'
import { sendEvent } from 'helpers/tracking'
import { DataReminderType } from '../constants'
import { setHiddenData } from '../thunks'
import { getTags } from '../../tags'
import { getAccLinks } from '../selectors'
import { AppThunk } from 'store'
import { AccountId, TagId } from 'types'
import { getAccounts } from 'store/localData/accounts'

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
  dispatch(setHiddenData(DataReminderType.ACC_LINKS, newLinks))
}

// SELECTORS

/**
 * Returns connections between tags and accounts. Is used to link transfers to tags
 * - One account -> One tag
 */
export const getAccTagMap = createSelector(
  [getAccLinks, getTags, getAccounts],
  (links, tags, accounts) => {
    if (!links) return {}
    const filtered = Object.entries(links).filter(
      // ignore connections for deleted tags
      ([accId, tagId]) => tags[tagId] && accounts[accId]
    )
    return Object.fromEntries(filtered)
  }
)

/**
 * Returns connections between tags and accounts. Is used to link transfers to tags
 * - One tag -> Several accounts
 */
export const getTagAccMap = createSelector([getAccTagMap], links => {
  let result = {} as { [tagId: string]: AccountId[] }
  Object.entries(links).forEach(([accId, tagId]) => {
    if (result[tagId]) result[tagId].push(accId)
    else result[tagId] = [accId]
  })
  return result
})
