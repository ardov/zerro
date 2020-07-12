import { createSelector } from 'redux-starter-kit'
import sendEvent from 'helpers/sendEvent'
import { ACC_LINKS } from '../constants'
import { setHiddenData } from '../thunks'
import { getTags } from '../../tags'
import { getRawAccLinks } from '../selectors'

// THUNK
export const addConnection = (account, tag) => (dispatch, getState) => {
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
  [getRawAccLinks, getTags],
  (links, tags) => {
    if (!links) return {}
    // ignore connections for deleted tags
    for (const accId in links) {
      const tagId = links[accId]
      if (!tags[tagId]) delete links[accId]
    }
    return links
  }
)
