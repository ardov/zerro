import { createSlice, createSelector } from 'redux-starter-kit'
import { wipeData, updateData, removeSyncedFunc } from 'store/commonActions'
import { convertToSyncArray } from 'helpers/converters'
import { compareTags } from 'store/localData/hiddenData/tagOrder'
import populateTags from './populateTags'

// INITIAL STATE
const initialState = {}

// SLICE
const { reducer, actions } = createSlice({
  slice: 'tag',
  initialState,
  reducers: {
    setTag: (state, { payload }) => {
      if (Array.isArray(payload)) {
        payload.forEach(tr => (state[tr.id] = tr))
      } else {
        state[payload.id] = payload
      }
    },
    // removeTag: (state, { payload }) => {
    //   delete state[payload]
    // },
  },
  extraReducers: {
    [wipeData]: () => initialState,
    [updateData]: (state, { payload }) => {
      removeSyncedFunc(state, payload.syncStartTime)
    },
  },
})

// REDUCER
export default reducer

// ACTIONS
export const { setTag, removeTag } = actions

// SELECTORS
export const getTags = createSelector(
  ['serverData.tag', 'localData.tag'],
  (tags, diff) => ({ ...tags, ...diff })
)

export const getTagsToSync = state => convertToSyncArray(state.localData.tag)

export const getTag = (state, id) => getTags(state)[id]

export const getPopulatedTags = createSelector([getTags], populateTags)

export const getPopulatedTag = (state, id) => getPopulatedTags(state)[id]

export const getTagsTree = createSelector(
  [getPopulatedTags, compareTags],
  (tags, compare) => {
    let result = []
    for (const id in tags) {
      if (tags[id].parent) continue
      const tag = { ...tags[id] }
      if (tag.children)
        tag.children = tag.children.map(id => tags[id]).sort(compare)
      result.push(tag)
    }
    result.sort(compare)
    return result
  }
)

export const getTagLinks = createSelector([getPopulatedTags], tags => {
  let links = {}
  for (const id in tags) {
    if (tags[id].parent) continue
    links[id] = tags[id].children || []
  }
  return links
})
