// import { createSlice, createSelector } from 'redux-starter-kit'
import { createSlice, createSelector } from '@reduxjs/toolkit'
import { wipeData, updateData, removeSyncedFunc } from 'store/commonActions'
import { convertToSyncArray } from 'helpers/converters'
import { compareTags } from 'store/localData/hiddenData/tagOrder'
import populateTags from './populateTags'
import { Modify, PopulatedTag, Tag, TagId } from 'types'
import { RootState } from 'store'

export interface Tags {
  [key: string]: Tag
}

// INITIAL STATE
const initialState: Tags = {}

// SLICE
const { reducer, actions } = createSlice({
  name: 'tag',
  initialState,
  reducers: {
    setTag: (state, { payload }) => {
      if (Array.isArray(payload)) {
        payload.forEach(tr => (state[tr.id] = tr))
      } else {
        state[payload.id] = payload
      }
    },
    removeTag: (state, { payload }) => {
      delete state[payload]
    },
  },
  extraReducers: builder => {
    builder
      .addCase(wipeData, () => initialState)
      .addCase(updateData, (state, { payload }) => {
        removeSyncedFunc(state, payload.syncStartTime || 0)
      })
  },
})

// REDUCER
export default reducer

// ACTIONS
export const { setTag, removeTag } = actions

// SELECTORS
const getServerTags = (state: RootState) => state.serverData.tag
const getLocalTags = (state: RootState) => state.localData.tag
export const getTags = createSelector(
  [getServerTags, getLocalTags],
  (tags, diff) => ({
    ...tags,
    ...diff,
  })
)

export const getTagsToSync = (state: RootState) =>
  convertToSyncArray(state.localData.tag)

export const getTag = (state: RootState, id: string): Tag | undefined =>
  getTags(state)[id]

export const getPopulatedTags = createSelector([getTags], populateTags)

export const getPopulatedTag = (state: RootState, id: string) =>
  getPopulatedTags(state)[id]

type TagTreeNode = Modify<PopulatedTag, { children: PopulatedTag[] }>
export const getTagsTree = createSelector(
  [getPopulatedTags, compareTags],
  (tags, compare) => {
    let result = []
    for (const id in tags) {
      if (tags[id].parent) continue
      const tag = { ...tags[id], children: [] } as TagTreeNode
      if (tags[id].children)
        tag.children = tags[id].children.map(id => tags[id]).sort(compare)
      result.push(tag)
    }
    result.sort(compare)
    return result
  }
)

interface Links {
  [tagId: string]: TagId[]
}
export const getTagLinks = createSelector([getPopulatedTags], tags => {
  let links = {} as Links
  for (const id in tags) {
    if (tags[id].parent) continue
    links[id] = tags[id].children || []
  }
  return links
})
