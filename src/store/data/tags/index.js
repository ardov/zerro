import { createSlice, createSelector } from 'redux-starter-kit'
import { wipeData, updateData, updateDataFunc } from 'store/data/commonActions'
import { convertToSyncArray } from 'helpers/converters'
import Tag from './Tag'

// INITIAL STATE
const initialState = {}

// SLICE
const { reducer } = createSlice({
  slice: 'tag',
  initialState,
  reducers: {},
  extraReducers: {
    [wipeData]: () => initialState,
    [updateData]: (state, { payload }) => {
      updateDataFunc(state, payload, 'tag')
    },
  },
})

// REDUCER
export default reducer

// ACTIONS
// ...

// SELECTORS
export const getTags = state => state.data.tag
export const getTagsToSave = createSelector(
  [getTags],
  tags => convertToSyncArray(tags)
)

export const getTag = (state, id) => state.data.tag[id]

export const getPopulatedTags = createSelector(
  ['data.tag'],
  tags => {
    const result = {}
    for (const id in tags) {
      result[id] = new Tag(tags[id])
    }
    result[null] = Tag.nullTag
    return result
  }
)

export const getPopulatedTag = (state, id) => getPopulatedTags(state)[id]

export const getTagsTree = createSelector(
  [getPopulatedTags],
  tags => {
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
  }
)
