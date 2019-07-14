import { createSlice, createSelector } from 'redux-starter-kit'
import { wipeData, updateData } from 'store/data/commonActions'
import populate from './populate'
import { convertToSyncArray } from 'Utils/converters'

// INITIAL STATE
const initialState = {}

// SLICE
const { reducer } = createSlice({
  slice: 'tags',
  initialState,
  reducers: {},
  extraReducers: {
    [wipeData]: () => initialState,
    [updateData]: (state, { payload }) => {
      if (payload.tag) {
        payload.tag.forEach(item => (state[item.id] = item))
      }
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
      result[id] = populate(tags[id])
    }
    result[null] = {
      id: null,
      user: null,
      changed: 0,
      icon: null,
      budgetIncome: true,
      budgetOutcome: true,
      required: false,
      color: null,
      picture: null,
      showIncome: false,
      showOutcome: false,
      parent: null,

      fullTitle: 'Без категории',
      title: 'Без категории',
      symbol: '?',
    }
    return result
  }
)

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
