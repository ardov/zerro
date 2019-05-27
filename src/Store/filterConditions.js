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

// HELPER

export const checkTransaction = conditions => tr => {
  const {
    search,
    type,
    showDeleted,
    fromDate,
    toDate,
    tags,
    accounts,
    amountFrom,
    amountTo
  } = conditions

  const checkSearch = () => {
    if (!search) return true
    if (tr.comment && tr.comment.toUpperCase().includes(search.toUpperCase()))
      return true
    if (tr.payee && tr.payee.toUpperCase().includes(search.toUpperCase()))
      return true

    return false
  }

  const checkTags = () => {
    if (!tags) return true
    if (!tr.tag) return false
    let result = false
    tr.tag.forEach(({ id }) => {
      if (tags.includes(id)) result = true
    })
    return result
  }

  const checkAmount = () => {
    if (!amountFrom && !amountTo) return true

    if (tr.type === 'income') {
      const income = tr.income * tr.incomeInstrument.rate
      return amountFrom <= income && income <= amountTo
    } else if (tr.type === 'outcome') {
      const outcome = tr.outcome * tr.outcomeInstrument.rate
      return amountFrom <= outcome && outcome <= amountTo
    } else if (tr.type === 'transfer') {
      const outcome = tr.outcome * tr.outcomeInstrument.rate
      const income = tr.income * tr.incomeInstrument.rate
      return (
        amountFrom <= income &&
        income <= amountTo &&
        (amountFrom <= outcome && outcome <= amountTo)
      )
    }
    console.warn('unknown type', tr.type)
    return false
  }

  return (
    (!type || tr.type === type) &&
    checkSearch() &&
    (showDeleted || !tr.deleted) &&
    (!fromDate || +tr.date >= +fromDate) &&
    (!toDate || +tr.date <= +toDate) &&
    checkTags() &&
    (!accounts ||
      accounts.includes(tr.incomeAccount) ||
      accounts.includes(tr.outcomeAccount)) &&
    checkAmount()
  )
}
