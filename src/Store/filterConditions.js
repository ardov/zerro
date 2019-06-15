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

export const check = conditions => tr => {
  const mergedConditions = { initialState, ...conditions }
  const {
    search,
    type,
    showDeleted,
    tags,
    accounts,

    fromDate,
    toDate,

    amountFrom,
    amountTo
  } = mergedConditions

  const checkSearch = (tr, search) =>
    !search ||
    (tr.comment && tr.comment.toUpperCase().includes(search.toUpperCase())) ||
    (tr.payee && tr.payee.toUpperCase().includes(search.toUpperCase()))

  const checkType = (tr, type) => !type || tr.type === type

  const checkDeleted = (tr, showDeleted) => showDeleted || !tr.deleted

  const checkDate = (tr, fromDate, toDate) =>
    (!fromDate || +tr.date >= +fromDate) && (!toDate || +tr.date <= +toDate)

  const checkAccounts = (tr, accounts) => {
    if (!accounts) return true
    const incomeAccountId = tr.incomeAccount ? tr.incomeAccount.id : null
    const outcomeAccountId = tr.outcomeAccount ? tr.outcomeAccount.id : null
    return (
      accounts.includes(incomeAccountId) || accounts.includes(outcomeAccountId)
    )
  }

  const checkTags = (tr, tags) => {
    if (!tags) return true
    if (!tr.tag && tags.includes(null) && tr.type !== 'transfer') return true
    if (!tr.tag) return false
    let result = false
    tr.tag.forEach(({ id }) => {
      if (tags.includes(id)) result = true
    })
    return result
  }

  const checkAmount = (tr, amount, compareType = 'lessOrEqual') => {
    if (!amount) return true
    const trAmount =
      tr.type === 'income'
        ? tr.income * tr.incomeInstrument.rate
        : tr.outcome * tr.outcomeInstrument.rate

    return compareType === 'lessOrEqual'
      ? trAmount <= amount
      : trAmount >= amount
  }

  return (
    checkType(tr, type) &&
    checkSearch(tr, search) &&
    checkDeleted(tr, showDeleted) &&
    checkDate(tr, fromDate, toDate) &&
    checkTags(tr, tags) &&
    checkAccounts(tr, accounts) &&
    checkAmount(tr, amountFrom, 'greaterOrEqual') &&
    checkAmount(tr, amountTo, 'lessOrEqual')
  )
}
