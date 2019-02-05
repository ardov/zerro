import * as actions from './actions'
import concat from 'lodash/concat'
import { createReducer } from 'redux-starter-kit'

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

const filterConditionsReducer = createReducer(initialState, {
  [actions.addTag]: (state, action) => {
    const tags = state.tags || []
    return { ...state, tags: concat(tags, action.payload) }
  },

  [actions.setTags]: (state, action) => ({
    ...state,
    tags: action.payload.length ? action.payload : null
  }),

  [actions.setCondition]: (state, action) => ({ ...state, ...action.payload }),

  [actions.resetCondition]: (state, action) => ({
    ...state,
    ...{ [action.payload]: initialState[action.payload] }
  }),

  [actions.resetAll]: () => initialState
})

export default filterConditionsReducer
