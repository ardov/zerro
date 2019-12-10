import { createSlice, createSelector } from 'redux-starter-kit'
import {
  wipeData,
  updateData,
  removeSynced,
  removeSyncedFunc,
  updateDataFunc,
} from 'store/data/commonActions'
import { convertToSyncArray } from 'helpers/converters'
import Tag from './Tag'

// INITIAL STATE
const initialState = { server: {}, diff: {} }

// SLICE
const { reducer, actions } = createSlice({
  slice: 'tag',
  initialState,
  reducers: {
    setTag: ({ diff }, { payload }) => {
      if (Array.isArray(payload)) {
        payload.forEach(tr => (diff[tr.id] = tr))
      } else {
        diff[payload.id] = payload
      }
    },
    // removeTag: ({ diff }, { payload }) => {
    //   delete diff[payload]
    // },
  },
  extraReducers: {
    [wipeData]: () => initialState,
    [removeSynced]: ({ diff }, { payload }) => {
      removeSyncedFunc(diff, payload)
    },
    [updateData]: ({ server }, { payload }) => {
      updateDataFunc(server, payload, 'tag')
    },
  },
})

// REDUCER
export default reducer

// ACTIONS
export const { setTag, removeTag } = actions

// SELECTORS
export const getTags = createSelector(
  ['data.tag.server', 'data.tag.diff'],
  (tags, diff) => ({ ...tags, ...diff })
)

export const getTagsToSave = createSelector(['data.tag.server'], tags =>
  convertToSyncArray(tags)
)

export const getTagsToSync = state => convertToSyncArray(state.data.tag.diff)

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
