import concat from 'lodash/concat'
import * as types from '../actionTypes'

const defaultConditions = {
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

export default function filterConditions(
  conditions = defaultConditions,
  action = {}
) {
  const { type, payload } = action

  switch (type) {
    case types.FILTER_ADD_TAG:
      const tags = conditions.tags || []
      return { ...conditions, tags: concat(tags, payload) }

    case types.FILTER_SET_CONDITION:
      return { ...conditions, ...payload }

    case types.FILTER_SET_TAGS:
      return { ...conditions, tags: payload.length ? payload : null }

    case types.FILTER_RESET_CONDITION:
      return {
        ...conditions,
        ...{ [payload]: defaultConditions[payload] }
      }

    case types.FILTER_RESET_ALL:
      return { ...defaultConditions }

    case types.FILTER_REMOVE_TAG:
      // TODO
      return conditions

    default:
      return conditions
  }
}
