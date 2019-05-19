import concat from 'lodash/concat'
import { createReducer, createAction } from 'redux-starter-kit'

// ACTIONS
export const addTag = createAction('filterConditions/addTag')
export const setTags = createAction('filterConditions/setTags')
export const setCondition = createAction('filterConditions/setCondition')
export const resetAll = createAction('filterConditions/resetAll')
export const resetCondition = createAction('filterConditions/resetCondition')

// INITIAL STATE
const initialState = {
  search: null,
  type: null,
  showDeleted: false,
  fromDate: null,
  toDate: null,
  tags: null,
  accounts: null,
  amountFrom: null,
  amountTo: null
}

// REDUCER
export default createReducer(initialState, {
  [addTag]: (state, action) => {
    const tags = state.tags || []
    return { ...state, tags: concat(tags, action.payload) }
  },

  [setTags]: (state, action) => ({
    ...state,
    tags: action.payload.length ? action.payload : null
  }),

  [setCondition]: (state, action) => ({ ...state, ...action.payload }),

  [resetCondition]: (state, action) => ({
    ...state,
    ...{ [action.payload]: initialState[action.payload] }
  }),

  [resetAll]: () => initialState
})

// SELECTORS
export const getFilterConditions = state => state.filterConditions
