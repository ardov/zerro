import { createSlice, createSelector } from 'redux-starter-kit'
import {
  wipeData,
  removeSynced,
  removeSyncedFunc,
} from 'store/data/commonActions'
import { convertToSyncArray } from 'helpers/converters'
import Tag from './Tag'

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
    [removeSynced]: (state, { payload }) => {
      removeSyncedFunc(state, payload)
    },
  },
})

// REDUCER
export default reducer

// ACTIONS
export const { setTag, removeTag } = actions

// SELECTORS
export const getTags = createSelector(
  ['data.serverData.tag', 'data.tag'],
  (tags, diff) => ({ ...tags, ...diff })
)

export const getTagsToSync = state => convertToSyncArray(state.data.tag)

export const getTag = (state, id) => getTags(state)[id]

export const getPopulatedTags = createSelector([getTags], tags => {
  const result = {}
  for (const id in tags) {
    result[id] = new Tag(tags[id])
  }
  result[null] = Tag.nullTag
  return result
})

export const getPopulatedTag = (state, id) => getPopulatedTags(state)[id]

export const getTagsTree = createSelector([getPopulatedTags], tags => {
  const list = []
  for (const id in tags) {
    list.push(tags[id])
  }
  const topLevel = list
    .filter(tag => !tag.parent)
    .map(parent => ({ ...parent, children: [] }))
  list
    .filter(tag => tag.parent)
    .forEach(tag => {
      const parent = topLevel.find(topTag => topTag.id === tag.parent)
      parent.children.push(tag)
    })

  return topLevel
})
