import * as types from '../actionTypes'

export const setCondition = id => {
  return { type: types.FILTER_SET_CONDITION, payload: id }
}

export const setTags = tags => {
  return { type: types.FILTER_SET_TAGS, payload: tags }
}

export const addTag = id => {
  return { type: types.FILTER_ADD_TAG, payload: id }
}

export const removeTag = id => {
  return { type: types.FILTER_REMOVE_TAG, payload: id }
}

export const resetAll = id => {
  return { type: types.FILTER_RESET_ALL, payload: id }
}

export const resetCondition = id => {
  return { type: types.FILTER_RESET_CONDITION, payload: id }
}
