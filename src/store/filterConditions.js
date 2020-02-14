import { createSlice } from 'redux-starter-kit'
import concat from 'lodash/concat'
import { getType } from './localData/transactions/helpers'

// INITIAL STATE
const initialState = {
  search: null,
  type: null,
  showDeleted: false,
  dateFrom: null,
  dateTo: null,
  tags: null,
  accounts: null,
  amountFrom: null,
  amountTo: null,
}

const { reducer, actions, selectors } = createSlice({
  slice: 'filterConditions',
  initialState,
  reducers: {
    addTag: (state, { payload }) => {
      const tags = state.tags || []
      state.tags = concat(tags, payload)
    },
    setTags: (state, { payload }) => {
      state.tags = payload
    },
    setCondition: (state, { payload }) => ({ ...state, ...payload }),
    resetCondition: (state, { payload }) => {
      state[payload] = initialState[payload]
    },
    resetAll: () => initialState,
  },
})

// REDUCER
export default reducer

// ACTIONS
export const {
  addTag,
  setTags,
  setCondition,
  resetCondition,
  resetAll,
} = actions

// SELECTORS
export const { getFilterConditions } = selectors

// HELPER
export const check = conditions => tr => {
  const mergedConditions = { initialState, ...conditions }
  const {
    search,
    type,
    showDeleted,
    tags,
    accounts,

    dateFrom,
    dateTo,

    amountFrom,
    amountTo,
  } = mergedConditions

  const checkSearch = (tr, search) =>
    !search ||
    (tr.comment && tr.comment.toUpperCase().includes(search.toUpperCase())) ||
    (tr.payee && tr.payee.toUpperCase().includes(search.toUpperCase()))

  const checkType = (tr, type) => !type || tr.type === type

  const checkDeleted = (tr, showDeleted) => showDeleted || !tr.deleted

  const checkDate = (tr, dateFrom, dateTo) =>
    (!dateFrom || +tr.date >= +dateFrom) && (!dateTo || +tr.date <= +dateTo)

  const checkAccounts = (tr, accounts) => {
    if (!accounts) return true
    const incomeAccountId = tr.incomeAccount ? tr.incomeAccount.id : null
    const outcomeAccountId = tr.outcomeAccount ? tr.outcomeAccount.id : null
    return (
      accounts.includes(incomeAccountId) || accounts.includes(outcomeAccountId)
    )
  }

  const checkTags = (tr, tags) => {
    if (!tags || !tags.length) return true
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
    const trAmount = tr.type === 'income' ? tr.income : tr.outcome

    return compareType === 'lessOrEqual'
      ? trAmount <= amount
      : trAmount >= amount
  }

  return (
    checkType(tr, type) &&
    checkSearch(tr, search) &&
    checkDeleted(tr, showDeleted) &&
    checkDate(tr, dateFrom, dateTo) &&
    checkTags(tr, tags) &&
    checkAccounts(tr, accounts) &&
    checkAmount(tr, amountFrom, 'greaterOrEqual') &&
    checkAmount(tr, amountTo, 'lessOrEqual')
  )
}

export const checkRaw = conditions => tr => {
  if (!conditions) return true
  const {
    search,
    type,
    showDeleted,
    tags,
    accounts,

    dateFrom,
    dateTo,

    amountFrom,
    amountTo,
  } = conditions

  const checkSearch = (tr, search) =>
    !search ||
    (tr.comment && tr.comment.toUpperCase().includes(search.toUpperCase())) ||
    (tr.payee && tr.payee.toUpperCase().includes(search.toUpperCase()))

  const checkType = (tr, type) => !type || getType(tr) === type

  const checkDeleted = (tr, showDeleted) => showDeleted || !tr.deleted

  const checkDate = (tr, dateFrom, dateTo) =>
    (!dateFrom || +tr.date >= +dateFrom) && (!dateTo || +tr.date <= +dateTo)

  const checkAccounts = (tr, accounts) => {
    if (!accounts) return true
    return (
      accounts.includes(tr.incomeAccount) ||
      accounts.includes(tr.outcomeAccount)
    )
  }

  const checkTags = (tr, tags) => {
    if (!tags || !tags.length) return true
    if (!tr.tag && tags.includes(null) && getType(tr) !== 'transfer')
      return true
    if (!tr.tag) return false
    let result = false
    tr.tag.forEach(id => {
      if (tags.includes(id)) result = true
    })
    return result
  }

  const checkAmount = (tr, amount, compareType = 'lessOrEqual') => {
    if (!amount) return true
    const trAmount = getType(tr) === 'income' ? tr.income : tr.outcome

    return compareType === 'lessOrEqual'
      ? trAmount <= amount
      : trAmount >= amount
  }

  return (
    checkType(tr, type) &&
    checkSearch(tr, search) &&
    checkDeleted(tr, showDeleted) &&
    checkDate(tr, dateFrom, dateTo) &&
    checkTags(tr, tags) &&
    checkAccounts(tr, accounts) &&
    checkAmount(tr, amountFrom, 'greaterOrEqual') &&
    checkAmount(tr, amountTo, 'lessOrEqual')
  )
}
